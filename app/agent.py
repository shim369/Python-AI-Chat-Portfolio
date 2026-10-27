"""手動のエージェントループ。

モデル応答に関数呼び出しがあればツールを実行して結果を返し、テキスト回答になるまで繰り返す。
Gemini の自動実行（automatic function calling）は使わず、流れをこのファイルで明示的に書いている。

Vercel の関数最大実行時間に収めるため、反復回数と全体の時間予算に上限を設ける。
最後の反復ではツールを使わせず、必ずテキストで答えさせる。
"""

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

from app.llm import (
    LLMClient,
    LLMTimeoutError,
    ModelTurn,
    TextDelta,
    ToolResultsTurn,
    ToolSpec,
    TurnComplete,
    Turn,
    UserTurn,
)
from app.schemas import ChatMessage
from app.tools import execute_tool

# 残り時間がこれ未満なら、新たにモデルを呼び出さない
MIN_CALL_SECONDS = 2.0


@dataclass
class AgentEvent:
    """フロントへ SSE で送るイベント。

    type:
      tool   … ツールを実行した（name）
      delta  … 回答テキストの断片（text）
      notice … 補足の通知（code。例: partial_timeout）
      done   … 回答完了（tools: 呼んだツール名, usage: トークン使用量の合計）
    """

    type: str
    data: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentLimits:
    max_iterations: int
    budget_seconds: float
    llm_timeout_seconds: float


async def run_agent(
    llm: LLMClient,
    system: str,
    messages: list[ChatMessage],
    tools: list[ToolSpec],
    limits: AgentLimits,
) -> AsyncIterator[AgentEvent]:
    loop = asyncio.get_running_loop()
    deadline = loop.time() + limits.budget_seconds
    turns: list[Turn] = [UserTurn(m.text) if m.role == "user" else ModelTurn(text=m.text) for m in messages]
    tools_used: list[str] = []
    usage: dict[str, int] = {}
    answered = ""

    def done() -> AgentEvent:
        return AgentEvent("done", {"tools": tools_used, "usage": usage})

    for iteration in range(limits.max_iterations):
        remaining = deadline - loop.time()
        if remaining < MIN_CALL_SECONDS:
            break
        is_last = iteration == limits.max_iterations - 1
        complete: TurnComplete | None = None
        try:
            async for event in llm.stream(
                system,
                turns,
                tools,
                allow_tools=not is_last,
                timeout=min(limits.llm_timeout_seconds, remaining),
            ):
                if isinstance(event, TextDelta):
                    answered += event.text
                    yield AgentEvent("delta", {"text": event.text})
                else:
                    complete = event
        except LLMTimeoutError:
            # 途中まで回答できていれば、その分を活かして時間切れを通知する
            if answered:
                yield AgentEvent("notice", {"code": "partial_timeout"})
                yield done()
                return
            raise

        assert complete is not None, "LLMClient.stream must end with TurnComplete"
        for key, value in complete.usage.items():
            usage[key] = usage.get(key, 0) + value
        turns.append(complete.turn)

        if not complete.turn.tool_calls:
            yield done()
            return

        results = []
        for call in complete.turn.tool_calls:
            tools_used.append(call.name)
            yield AgentEvent("tool", {"name": call.name})
            results.append((call, await execute_tool(call.name, call.args)))
        turns.append(ToolResultsTurn(results))

    # 時間予算を使い切った（最後の反復はツールを許可しないため、通常はここに来ない）
    if answered:
        yield AgentEvent("notice", {"code": "partial_timeout"})
        yield done()
        return
    raise LLMTimeoutError("agent budget exhausted")
