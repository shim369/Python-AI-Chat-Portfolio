"""テスト共通の部品。実際の Gemini API・外部サイトには一切アクセスしない。"""

from collections.abc import AsyncIterator, Callable

import pytest
from fastapi.testclient import TestClient

from app import blog
from app.llm import TextDelta, ToolSpec, Turn, TurnComplete
from app.main import app, get_llm_client, get_rate_limiter
from app.rate_limit import RateLimiter

# 1 回のモデル呼び出しで返すイベント列。例外を入れるとその時点で送出する
Step = list[TextDelta | TurnComplete | Exception]


class ScriptedLLM:
    """呼び出しごとに用意したイベント列を返す LLMClient のモック。"""

    def __init__(self, steps: list[Step]):
        self.steps = list(steps)
        self.calls: list[dict] = []

    async def stream(
        self,
        system: str,
        turns: list[Turn],
        tools: list[ToolSpec],
        *,
        allow_tools: bool,
        timeout: float,
    ) -> AsyncIterator[TextDelta | TurnComplete]:
        self.calls.append(
            {"system": system, "turns": list(turns), "tools": tools, "allow_tools": allow_tools, "timeout": timeout}
        )
        for item in self.steps.pop(0):
            if isinstance(item, Exception):
                raise item
            yield item


@pytest.fixture(autouse=True)
def isolate_environment(monkeypatch: pytest.MonkeyPatch):
    # 実 API キーが環境にあっても使われないようにする
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(blog, "_cache", None)

    async def no_network(*args, **kwargs):
        raise AssertionError("tests must not access the real blog")

    monkeypatch.setattr(blog.httpx.AsyncClient, "get", no_network)
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def make_client() -> Callable[..., tuple[TestClient, ScriptedLLM]]:
    """ScriptedLLM とレート制限を差し替えた TestClient を作る。"""

    def factory(steps: list[Step] | None = None, limiter: RateLimiter | None = None):
        llm = ScriptedLLM(steps or [])
        app.dependency_overrides[get_llm_client] = lambda: llm
        app.dependency_overrides[get_rate_limiter] = lambda: limiter or RateLimiter(0, 0, 0)
        return TestClient(app), llm

    return factory


def parse_sse(text: str) -> list[tuple[str, dict]]:
    import json

    events = []
    for block in text.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events
