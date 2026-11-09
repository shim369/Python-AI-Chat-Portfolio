import asyncio
import json
from email.message import EmailMessage

import httpx
import pytest
from fastapi.testclient import TestClient

from app import contact as contact_module
from app.config import Settings, get_settings
from app.contact import ContactError, verify_recaptcha
from app.main import app, get_contact_rate_limiter, get_mail_sender, get_recaptcha_verifier
from app.rate_limit import RateLimiter

FORM = {
    "name": "山田 太郎",
    "email": "taro@example.com",
    "message": "お仕事のご相談です。",
    "recaptcha_token": "token-123",
    "lang": "ja",
}


@pytest.fixture
def configured(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CONTACT_TO_EMAIL", "owner@example.com")
    monkeypatch.setenv("SMTP_USER", "sender@example.com")
    monkeypatch.setenv("SMTP_PASS", "app-password")
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "secret")


@pytest.fixture
def make_contact_client():
    """reCAPTCHA の検証とメール送信を差し替えた TestClient を作る。"""

    def factory(score: float = 0.9, verify_error: ContactError | None = None, limiter: RateLimiter | None = None):
        sent: list[EmailMessage] = []
        tokens: list[str] = []

        async def fake_verify(token: str, settings: Settings) -> float:
            tokens.append(token)
            if verify_error:
                raise verify_error
            return score

        app.dependency_overrides[get_recaptcha_verifier] = lambda: fake_verify
        app.dependency_overrides[get_mail_sender] = lambda: lambda msg, settings: sent.append(msg)
        app.dependency_overrides[get_contact_rate_limiter] = lambda: limiter or RateLimiter(0, 0, 0)
        return TestClient(app), sent, tokens

    return factory


def test_contact_verifies_recaptcha_and_sends_mail(configured, make_contact_client, capsys: pytest.CaptureFixture):
    client, sent, tokens = make_contact_client()
    res = client.post("/api/contact", json=FORM)

    assert res.status_code == 200 and res.json()["ok"] is True
    assert tokens == ["token-123"]
    [msg] = sent
    assert msg["To"] == "owner@example.com"
    assert msg["From"] == "sender@example.com"
    assert msg["Reply-To"] == "taro@example.com"
    assert "山田 太郎" in msg["Subject"]
    assert "お仕事のご相談です。" in msg.get_content()

    # ログには氏名・メールアドレス・本文を残さない
    logs = capsys.readouterr().out
    entry = next(json.loads(line) for line in logs.splitlines() if '"contact_sent"' in line)
    assert entry["recaptcha_score"] == 0.9
    assert "山田" not in logs and "taro@example.com" not in logs and "ご相談" not in logs


def test_contact_rejects_failed_recaptcha(configured, make_contact_client):
    client, sent, _ = make_contact_client(verify_error=ContactError("recaptcha_failed", 403, "low score"))
    res = client.post("/api/contact", json=FORM)

    assert res.status_code == 403
    assert res.json()["code"] == "recaptcha_failed"
    assert sent == []


def test_contact_skips_recaptcha_without_secret(configured, make_contact_client, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("RECAPTCHA_SECRET_KEY")
    client, sent, tokens = make_contact_client()
    res = client.post("/api/contact", json={**FORM, "recaptcha_token": ""})

    assert res.status_code == 200
    assert tokens == [] and len(sent) == 1


def test_contact_is_unavailable_without_smtp_settings(make_contact_client):
    client, sent, _ = make_contact_client()
    res = client.post("/api/contact", json=FORM)

    assert res.status_code == 503
    assert res.json()["code"] == "contact_unavailable"
    assert sent == []


@pytest.mark.parametrize(
    ("field", "value", "code"),
    [
        ("name", "   ", "name_required"),
        ("name", "あ" * 101, "name_too_long"),
        ("email", "", "email_required"),
        ("email", "not-an-email", "invalid_email"),
        ("email", "a@example.com\nBcc: x@example.com", "invalid_email"),
        ("message", "", "message_required"),
        ("message", "あ" * 2001, "message_too_long"),
    ],
)
def test_contact_validates_input(configured, make_contact_client, field, value, code):
    client, sent, _ = make_contact_client()
    res = client.post("/api/contact", json={**FORM, field: value})

    assert res.status_code == 422
    assert res.json()["code"] == code
    assert sent == []


def test_contact_puts_name_on_a_single_line(configured, make_contact_client):
    client, sent, _ = make_contact_client()
    client.post("/api/contact", json={**FORM, "name": "山田\r\nBcc: x@example.com"})

    assert sent[0]["Subject"] == "【ポートフォリオ】お問い合わせ: 山田 Bcc: x@example.com"
    assert sent[0]["Bcc"] is None


def test_contact_is_rate_limited(configured, make_contact_client):
    client, sent, _ = make_contact_client(limiter=RateLimiter(per_ip_per_minute=1, per_ip_per_day=0, global_per_minute=0))
    assert client.post("/api/contact", json=FORM).status_code == 200
    res = client.post("/api/contact", json=FORM)

    assert res.status_code == 429
    assert len(sent) == 1


def _settings(monkeypatch: pytest.MonkeyPatch) -> Settings:
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "secret")
    return get_settings()


def _mock_google(monkeypatch: pytest.MonkeyPatch, result: dict) -> list[dict]:
    requests: list[dict] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(dict(httpx.QueryParams(request.content.decode())))
        return httpx.Response(200, json=result)

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        contact_module.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw)
    )
    return requests


def test_verify_recaptcha_accepts_matching_action_and_score(monkeypatch: pytest.MonkeyPatch):
    requests = _mock_google(monkeypatch, {"success": True, "action": "contact", "score": 0.7})
    assert asyncio.run(verify_recaptcha("tok", _settings(monkeypatch))) == 0.7
    assert requests == [{"secret": "secret", "response": "tok"}]


@pytest.mark.parametrize(
    "result",
    [
        {"success": False, "error-codes": ["invalid-input-response"]},
        {"success": True, "action": "login", "score": 0.9},
        {"success": True, "action": "contact", "score": 0.3},
    ],
)
def test_verify_recaptcha_rejects_bad_results(monkeypatch: pytest.MonkeyPatch, result: dict):
    _mock_google(monkeypatch, result)
    with pytest.raises(ContactError) as exc:
        asyncio.run(verify_recaptcha("tok", _settings(monkeypatch)))
    assert exc.value.code == "recaptcha_failed" and exc.value.status_code == 403


def test_verify_recaptcha_rejects_missing_token(monkeypatch: pytest.MonkeyPatch):
    with pytest.raises(ContactError) as exc:
        asyncio.run(verify_recaptcha("", _settings(monkeypatch)))
    assert exc.value.code == "recaptcha_failed"
