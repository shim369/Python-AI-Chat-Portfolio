"""LLM 呼び出しを閉じ込めるモジュール。

アプリの他の部分は LLMClient プロトコルと、このモジュールの例外だけに依存する。
プロバイダを差し替える場合は、このファイルに別の実装クラスを追加すればよい。
"""

import asyncio
from dataclasses import dataclass, field
from typing import Protocol

import httpx
from google import genai
from google.genai import errors, types

from app.config import Settings
from app.schemas import ChatMessage


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


@dataclass
class LLMResult:
    text: str
    usage: dict[str, int] = field(default_factory=dict)


class LLMClient(Protocol):
    async def generate(self, system: str, messages: list[ChatMessage]) -> LLMResult: ...


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

    async def generate(self, system: str, messages: list[ChatMessage]) -> LLMResult:
        contents = [
            types.Content(role=m.role, parts=[types.Part(text=m.text)]) for m in messages
        ]
        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=self._settings.max_output_tokens,
        )
        try:
            # SDK のタイムアウトに加え、全体でも上限をかける
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=self._settings.gemini_model, contents=contents, config=config
                ),
                timeout=self._settings.llm_timeout_seconds + 1,
            )
        except errors.APIError as e:
            if e.code == 429:
                raise LLMRateLimitError(str(e)) from e
            raise LLMError(f"{e.code}: {e}") from e
        except (asyncio.TimeoutError, httpx.TimeoutException) as e:
            raise LLMTimeoutError("timeout") from e

        return LLMResult(text=response.text or "", usage=_usage(response))


def _usage(response: types.GenerateContentResponse) -> dict[str, int]:
    meta = response.usage_metadata
    if meta is None:
        return {}
    return {
        "prompt_tokens": meta.prompt_token_count or 0,
        "output_tokens": meta.candidates_token_count or 0,
        "total_tokens": meta.total_token_count or 0,
    }
