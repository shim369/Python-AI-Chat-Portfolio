import asyncio

import pytest

from app import agent
from app.agent import AgentLimits, AgentStats, run_agent
from app.llm import (
    LLMRateLimitError,
    LLMServerError,
    LLMTimeoutError,
    ModelTurn,
    TextDelta,
    ToolCall,
    ToolResultsTurn,
    TurnComplete,
    UserTurn,
)
from app.schemas import ChatMessage
from app.tools import TOOL_SPECS
from tests.conftest import ScriptedLLM

LIMITS = AgentLimits(max_iterations=4, budget_seconds=40, llm_timeout_seconds=15, max_retries=2)
QUESTION = [ChatMessage(role="user", text="スキルを教えて")]


def tool_step(*names: str):
    return [TurnComplete(ModelTurn(tool_calls=[ToolCall(n, {}, id=f"id-{n}") for n in names]))]


def text_step(text: str):
    return [TextDelta(text), TurnComplete(ModelTurn(text=text), usage={"total_tokens": 10})]


def collect(llm: ScriptedLLM, limits: AgentLimits = LIMITS, stats: AgentStats | None = None):
    async def go():
        return [(e.type, e.data) async for e in run_agent(llm, "system", QUESTION, TOOL_SPECS, limits, stats)]

    return asyncio.run(go())


@pytest.fixture(autouse=True)
def no_retry_delay(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(agent, "RETRY_BASE_DELAY_SECONDS", 0)


def test_answers_directly_without_tools():
    llm = ScriptedLLM([text_step("こんにちは")])
    assert collect(llm) == [("delta", {"text": "こんにちは"}), ("done", {"tools": []})]
    assert len(llm.calls) == 1


def test_executes_tool_then_sends_result_back_to_model():
    llm = ScriptedLLM([tool_step("get_skills"), text_step("Python が得意です")])
    stats = AgentStats()
    events = collect(llm, stats=stats)

    assert events == [
        ("tool", {"name": "get_skills"}),
        ("delta", {"text": "Python が得意です"}),
        ("done", {"tools": ["get_skills"]}),
    ]
    # 2 回目の呼び出しには「ユーザー発言 → 関数呼び出し → 関数の結果」が渡る
    turns = llm.calls[1]["turns"]
    assert isinstance(turns[0], UserTurn)
    assert turns[1].tool_calls[0].name == "get_skills"
    assert isinstance(turns[2], ToolResultsTurn)
    call, result = turns[2].results[0]
    assert call.id == "id-get_skills" and "skills" in result
    assert stats.iterations == 2 and stats.usage == {"total_tokens": 10}


def test_runs_parallel_tool_calls_in_one_turn():
    llm = ScriptedLLM([tool_step("get_projects", "get_contact_info"), text_step("ok")])
    events = collect(llm)
    assert [e for e in events if e[0] == "tool"] == [
        ("tool", {"name": "get_projects"}),
        ("tool", {"name": "get_contact_info"}),
    ]


def test_last_iteration_disallows_tools_to_force_an_answer():
    limits = AgentLimits(max_iterations=3, budget_seconds=40, llm_timeout_seconds=15)
    llm = ScriptedLLM([tool_step("get_skills"), tool_step("get_projects"), text_step("まとめ")])
    events = collect(llm, limits)
    assert [c["allow_tools"] for c in llm.calls] == [True, True, False]
    assert events[-1] == ("done", {"tools": ["get_skills", "get_projects"]})


def test_call_timeout_never_exceeds_remaining_budget():
    limits = AgentLimits(max_iterations=2, budget_seconds=5, llm_timeout_seconds=15)
    llm = ScriptedLLM([text_step("ok")])
    collect(llm, limits)
    assert llm.calls[0]["timeout"] <= 5


def test_timeout_after_partial_answer_returns_partial_with_notice():
    llm = ScriptedLLM([tool_step("get_skills"), [TextDelta("途中まで"), LLMTimeoutError()]])
    events = collect(llm)
    assert events[-3:] == [
        ("delta", {"text": "途中まで"}),
        ("notice", {"code": "partial_timeout"}),
        ("done", {"tools": ["get_skills"]}),
    ]


def test_timeout_before_any_text_raises():
    llm = ScriptedLLM([[LLMTimeoutError()]])
    with pytest.raises(LLMTimeoutError):
        collect(llm)


def test_retries_transient_errors_up_to_the_limit():
    stats = AgentStats()
    llm = ScriptedLLM([[LLMServerError()], [LLMServerError()], text_step("ok")])
    events = collect(llm, stats=stats)
    assert events[-1] == ("done", {"tools": []})
    assert stats.retries == 2 and len(llm.calls) == 3


def test_gives_up_after_max_retries():
    llm = ScriptedLLM([[LLMServerError()], [LLMServerError()], [LLMServerError()]])
    with pytest.raises(LLMServerError):
        collect(llm)
    assert len(llm.calls) == 3


def test_does_not_retry_once_text_was_streamed():
    llm = ScriptedLLM([[TextDelta("途中"), LLMServerError()], text_step("重複")])
    with pytest.raises(LLMServerError):
        collect(llm)
    assert len(llm.calls) == 1


def test_does_not_retry_rate_limit_errors():
    llm = ScriptedLLM([[LLMRateLimitError()], text_step("ok")])
    with pytest.raises(LLMRateLimitError):
        collect(llm)
    assert len(llm.calls) == 1


def test_unknown_tool_result_is_passed_back_instead_of_crashing():
    llm = ScriptedLLM([tool_step("no_such_tool"), text_step("分かりません")])
    events = collect(llm)
    _, result = llm.calls[1]["turns"][2].results[0]
    assert result == {"error": "unknown tool: no_such_tool"}
    assert events[-1][0] == "done"


def test_previous_model_messages_are_sent_as_text_turns():
    messages = [
        ChatMessage(role="user", text="Q1"),
        ChatMessage(role="model", text="A1"),
        ChatMessage(role="user", text="Q2"),
    ]
    llm = ScriptedLLM([text_step("A2")])

    async def go():
        return [e async for e in run_agent(llm, "system", messages, TOOL_SPECS, LIMITS)]

    asyncio.run(go())
    turns = llm.calls[0]["turns"]
    assert [type(t).__name__ for t in turns] == ["UserTurn", "ModelTurn", "UserTurn"]
    assert turns[1].text == "A1" and turns[1].raw is None
