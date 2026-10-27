"""LLM 呼び出しを閉じ込めるモジュール。

アプリの他の部分は、このモジュールのプロバイダ非依存な型（ToolSpec / ModelTurn など）、
LLMClient プロトコル、例外だけに依存する。プロバイダを差し替える場合は、
このファイルに別の実装クラスを追加すればよい。
"""

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx
from google import genai
from google.genai import errors, types

from app.config import Settings


class LLMError(Exception):
    """LLM 呼び出しの失敗。code はフロントが表示言語の文言を選ぶためのキー、user_message は日本語の既定文言。"""

    status_code = 502
    code = "llm_error"
    user_message = "AIの応答取得中にエラーが発生しました。少し待ってから再試行してください。"


class LLMRateLimitError(LLMError):
    status_code = 429
    code = "rate_limited"
    user_message = "現在アクセスが集中しています。少し待ってから再試行してください。"


class LLMTimeoutError(LLMError):
    status_code = 504
    code = "timeout"
    user_message = "AIの応答に時間がかかりすぎたため中断しました。再試行してください。"


class LLMConfigError(LLMError):
    status_code = 500
    code = "config_error"
    user_message = "AIチャットは現在利用できません（サーバー設定エラー）。"


# ---- プロバイダ非依存の型 ----


@dataclass
class ToolSpec:
    """ツールのスキーマ。parameters は JSON Schema。"""

    name: str
    description: str
    parameters: dict[str, Any]


@dataclass
class ToolCall:
    name: str
    args: dict[str, Any]
    id: str | None = None


@dataclass
class UserTurn:
    text: str


@dataclass
class ModelTurn:
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    # プロバイダ固有の応答そのもの。Gemini 3 系は関数呼び出しに付く thought signature を
    # 次のリクエストでそのまま返す必要があるため、履歴にはこれを優先して使う
    raw: Any = None


@dataclass
class ToolResultsTurn:
    results: list[tuple[ToolCall, dict[str, Any]]]


Turn = UserTurn | ModelTurn | ToolResultsTurn


@dataclass
class TextDelta:
    """ストリーミング中のテキスト断片。"""

    text: str


@dataclass
class TurnComplete:
    """1 回のモデル応答の完了。turn.tool_calls が空ならテキスト回答で終わったことを表す。"""

    turn: ModelTurn
    usage: dict[str, int] = field(default_factory=dict)


class LLMClient(Protocol):
    def stream(
        self,
        system: str,
        turns: list[Turn],
        tools: list[ToolSpec],
        *,
        allow_tools: bool,
        timeout: float,
    ) -> AsyncIterator[TextDelta | TurnComplete]:
        """モデルを 1 回呼び出し、TextDelta を順に返したあと最後に TurnComplete を 1 つ返す。

        timeout は、この呼び出し全体（ストリームの読み終わりまで）の上限秒数。
        """
        ...


# ---- Gemini 実装 ----


class GeminiClient:
    def __init__(self, settings: Settings):
        if not settings.gemini_api_key:
            raise LLMConfigError("GEMINI_API_KEY is not set")
        self._settings = settings
        self._client = genai.Client(
            api_key=settings.gemini_api_key,
            # SDK 内蔵の自動リトライは実行時間の予算を読めなくするため無効化する
            http_options=types.HttpOptions(
                timeout=settings.llm_timeout_seconds * 1000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )

    async def stream(
        self,
        system: str,
        turns: list[Turn],
        tools: list[ToolSpec],
        *,
        allow_tools: bool,
        timeout: float,
    ) -> AsyncIterator[TextDelta | TurnComplete]:
        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=self._settings.max_output_tokens,
            tools=[types.Tool(function_declarations=[_to_declaration(t) for t in tools])],
            # 自動実行は使わず、関数呼び出しは agent.py のループで明示的に処理する
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            tool_config=types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(
                    mode=types.FunctionCallingConfigMode.AUTO
                    if allow_tools
                    else types.FunctionCallingConfigMode.NONE
                )
            ),
        )
        loop = asyncio.get_running_loop()
        deadline = loop.time() + timeout
        parts: list[types.Part] = []
        usage: dict[str, int] = {}

        def remaining() -> float:
            return max(0.0, deadline - loop.time())

        try:
            stream = await asyncio.wait_for(
                self._client.aio.models.generate_content_stream(
                    model=self._settings.gemini_model,
                    contents=[_to_content(t) for t in turns],
                    config=config,
                ),
                timeout=remaining(),
            )
            iterator = aiter(stream)
            while True:
                # チャンクごとに残り時間で待つ（呼び出し全体で timeout を超えない）
                try:
                    chunk = await asyncio.wait_for(anext(iterator), timeout=remaining())
                except StopAsyncIteration:
                    break
                if chunk.usage_metadata:
                    usage = _usage(chunk.usage_metadata)
                candidate = chunk.candidates[0] if chunk.candidates else None
                if not candidate or not candidate.content or not candidate.content.parts:
                    continue
                for part in candidate.content.parts:
                    parts.append(part)
                    if part.text and not part.thought:
                        yield TextDelta(part.text)
        except errors.APIError as e:
            if e.code == 429:
                raise LLMRateLimitError(str(e)) from e
            raise LLMError(f"{e.code}: {e}") from e
        except (TimeoutError, httpx.TimeoutException) as e:
            raise LLMTimeoutError("timeout") from e

        calls = [
            ToolCall(name=p.function_call.name or "", args=dict(p.function_call.args or {}), id=p.function_call.id)
            for p in parts
            if p.function_call
        ]
        text = "".join(p.text for p in parts if p.text and not p.thought)
        raw = types.Content(role="model", parts=parts)
        yield TurnComplete(turn=ModelTurn(text=text, tool_calls=calls, raw=raw), usage=usage)


def _to_declaration(spec: ToolSpec) -> types.FunctionDeclaration:
    return types.FunctionDeclaration(
        name=spec.name, description=spec.description, parameters_json_schema=spec.parameters
    )


def _to_content(turn: Turn) -> types.Content:
    match turn:
        case UserTurn(text=text):
            return types.Content(role="user", parts=[types.Part(text=text)])
        case ModelTurn(raw=types.Content() as raw):
            return raw
        case ModelTurn(text=text):
            # ブラウザから送られてきた過去の AI 発言（テキストのみ）
            return types.Content(role="model", parts=[types.Part(text=text)])
        case ToolResultsTurn(results=results):
            return types.Content(
                role="user",
                parts=[
                    types.Part(
                        function_response=types.FunctionResponse(id=call.id, name=call.name, response=result)
                    )
                    for call, result in results
                ],
            )
    raise TypeError(f"unsupported turn: {turn!r}")


def _usage(meta: types.GenerateContentResponseUsageMetadata) -> dict[str, int]:
    return {
        "prompt_tokens": meta.prompt_token_count or 0,
        "output_tokens": meta.candidates_token_count or 0,
        "total_tokens": meta.total_token_count or 0,
    }
