import pytest
from pydantic import ValidationError

from app.schemas import ChatRequest, InputError


def user(text: str) -> dict:
    return {"role": "user", "text": text}


def model(text: str) -> dict:
    return {"role": "model", "text": text}


def error_code(payload: dict) -> str:
    with pytest.raises(ValidationError) as exc_info:
        ChatRequest.model_validate(payload)
    ctx_error = exc_info.value.errors()[0].get("ctx", {}).get("error")
    return ctx_error.code if isinstance(ctx_error, InputError) else exc_info.value.errors()[0]["type"]


def test_accepts_a_simple_question_and_defaults_to_japanese():
    req = ChatRequest.model_validate({"messages": [user("こんにちは")]})
    assert req.lang == "ja"


def test_accepts_exactly_500_characters():
    ChatRequest.model_validate({"messages": [user("a" * 500)]})


def test_rejects_input_over_500_characters():
    assert error_code({"messages": [user("a" * 501)]}) == "input_too_long"


def test_rejects_when_last_message_is_not_from_user():
    assert error_code({"messages": [user("Q"), model("A")]}) == "invalid_input"


def test_rejects_empty_messages_and_empty_text():
    assert error_code({"messages": []}) == "too_short"
    assert error_code({"messages": [user("")]}) == "string_too_short"


def test_rejects_unknown_role_and_language():
    assert error_code({"messages": [{"role": "system", "text": "x"}]}) == "literal_error"
    assert error_code({"messages": [user("hi")], "lang": "fr"}) == "literal_error"


def test_rejects_oversized_model_messages():
    assert error_code({"messages": [model("a" * 4001), user("Q")]}) == "string_too_long"


def test_keeps_only_recent_history_starting_with_user(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MAX_HISTORY", "4")
    messages = [user("Q1"), model("A1"), user("Q2"), model("A2"), user("Q3")]
    req = ChatRequest.model_validate({"messages": messages})
    # 直近 4 件は A1, Q2, A2, Q3。先頭の AI 発言は落とす
    assert [m.text for m in req.messages] == ["Q2", "A2", "Q3"]
