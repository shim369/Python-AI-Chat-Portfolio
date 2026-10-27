import json

import pytest

from app.llm import LLMTimeoutError
from app.logging_utils import log_event
from tests.conftest import parse_sse

QUESTION = {"messages": [{"role": "user", "text": "hi"}]}


def test_info_and_warning_go_to_stdout_and_error_to_stderr(capsys: pytest.CaptureFixture):
    log_event("a", level="info")
    log_event("b", level="warning")
    log_event("c", level="error", error="boom")
    out, err = capsys.readouterr()
    assert [json.loads(line)["event"] for line in out.splitlines()] == ["a", "b"]
    assert [json.loads(line)["event"] for line in err.splitlines()] == ["c"]


def test_chat_error_inside_stream_is_logged_to_stderr(make_client, capsys: pytest.CaptureFixture):
    # SSE 開始後のエラーは HTTP 200 のまま返るため、ログの出力先で error として区別できる必要がある
    client, _ = make_client([[LLMTimeoutError()]])
    res = client.post("/api/chat", json=QUESTION)
    assert res.status_code == 200 and parse_sse(res.text)[0][0] == "error"

    out, err = capsys.readouterr()
    (log,) = [json.loads(line) for line in err.splitlines()]
    assert log["event"] == "chat_completed" and log["level"] == "error" and log["outcome"] == "timeout"
    assert "chat_completed" not in out
