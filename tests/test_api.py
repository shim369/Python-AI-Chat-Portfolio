import json

import pytest

from app.llm import LLMRateLimitError, ModelTurn, TextDelta, ToolCall, TurnComplete
from app.main import app, get_llm_client
from app.rate_limit import RateLimiter
from tests.conftest import parse_sse

QUESTION = {"lang": "ja", "messages": [{"role": "user", "text": "制作物を教えて"}]}


def test_health(make_client):
    client, _ = make_client()
    assert client.get("/api/health").json() == {"status": "ok"}


def test_chat_streams_tool_delta_and_done_events(make_client, capsys: pytest.CaptureFixture):
    client, llm = make_client(
        [
            [TurnComplete(ModelTurn(tool_calls=[ToolCall("get_projects", {})]))],
            [TextDelta("制作物は"), TextDelta("こちらです"), TurnComplete(ModelTurn(text="制作物はこちらです"))],
        ]
    )
    res = client.post("/api/chat", json=QUESTION)

    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/event-stream")
    request_id = res.headers["x-request-id"]
    assert parse_sse(res.text) == [
        ("tool", {"name": "get_projects"}),
        ("delta", {"text": "制作物は"}),
        ("delta", {"text": "こちらです"}),
        ("done", {"tools": ["get_projects"], "request_id": request_id}),
    ]
    assert "日本語" in llm.calls[0]["system"]

    # 構造化ログ: 1 行 1 JSON。発言本文・回答本文は含めない
    logs = [json.loads(line) for line in capsys.readouterr().out.splitlines()]
    log = next(entry for entry in logs if entry["event"] == "chat_completed")
    assert log["request_id"] == request_id
    assert log["outcome"] == "ok" and log["tools"] == ["get_projects"] and log["iterations"] == 2
    assert "duration_ms" in log
    raw = json.dumps(logs, ensure_ascii=False)
    assert "制作物を教えて" not in raw and "こちらです" not in raw


def test_chat_uses_english_prompt_for_lang_en(make_client):
    client, llm = make_client([[TextDelta("Hi"), TurnComplete(ModelTurn(text="Hi"))]])
    client.post("/api/chat", json={**QUESTION, "lang": "en"})
    assert "英語 (English)" in llm.calls[0]["system"]


def test_chat_sends_fallback_text_for_empty_reply(make_client):
    client, _ = make_client([[TurnComplete(ModelTurn(text=""))]])
    events = parse_sse(client.post("/api/chat", json=QUESTION).text)
    assert events[0][0] == "delta" and "うまく回答を生成できませんでした" in events[0][1]["text"]


def test_llm_errors_become_error_events_with_codes(make_client):
    client, _ = make_client([[LLMRateLimitError()]])
    res = client.post("/api/chat", json=QUESTION)
    (event, data), = parse_sse(res.text)
    assert event == "error"
    assert data["code"] == "rate_limited" and data["request_id"] == res.headers["x-request-id"]


def test_validation_errors_are_json_with_codes(make_client):
    client, llm = make_client()
    res = client.post("/api/chat", json={"messages": [{"role": "user", "text": "a" * 501}]})
    assert res.status_code == 422
    assert res.json()["code"] == "input_too_long"
    assert llm.calls == []


def test_missing_api_key_returns_config_error(make_client):
    make_client()
    del app.dependency_overrides[get_llm_client]
    from fastapi.testclient import TestClient

    res = TestClient(app).post("/api/chat", json=QUESTION)
    assert res.status_code == 500 and res.json()["code"] == "config_error"


def test_rate_limit_rejects_before_calling_the_llm(make_client):
    steps = [[TextDelta("ok"), TurnComplete(ModelTurn(text="ok"))] for _ in range(2)]
    client, llm = make_client(steps, limiter=RateLimiter(per_ip_per_minute=2, per_ip_per_day=0, global_per_minute=0))

    assert client.post("/api/chat", json=QUESTION).status_code == 200
    assert client.post("/api/chat", json=QUESTION).status_code == 200
    res = client.post("/api/chat", json=QUESTION)
    assert res.status_code == 429
    assert res.json()["code"] == "too_many_requests" and res.headers["retry-after"] == "60"
    assert len(llm.calls) == 2


def test_rate_limit_uses_forwarded_client_ip(make_client):
    steps = [[TextDelta("ok"), TurnComplete(ModelTurn(text="ok"))] for _ in range(2)]
    client, _ = make_client(steps, limiter=RateLimiter(per_ip_per_minute=1, per_ip_per_day=0, global_per_minute=0))

    assert client.post("/api/chat", json=QUESTION, headers={"x-real-ip": "203.0.113.1"}).status_code == 200
    assert client.post("/api/chat", json=QUESTION, headers={"x-real-ip": "203.0.113.2"}).status_code == 200
    assert client.post("/api/chat", json=QUESTION, headers={"x-real-ip": "203.0.113.1"}).status_code == 429
