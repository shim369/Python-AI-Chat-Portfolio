import pytest

from app.llm import ModelTurn, TextDelta, TurnComplete
from app.rate_limit import RateLimiter
from app.region import EEA_COUNTRIES, is_restricted

QUESTION = {"messages": [{"role": "user", "text": "hi"}]}


def ok_step():
    return [TextDelta("ok"), TurnComplete(ModelTurn(text="ok"))]


@pytest.mark.parametrize("country", ["DE", "FR", "IE", "NO", "IS", "LI", "CH", "GB", "gb", " de "])
def test_eea_switzerland_and_uk_are_restricted(country):
    assert is_restricted(country)


@pytest.mark.parametrize("country", ["JP", "US", "KR", "TR", "UA", "", None])
def test_other_or_unknown_countries_are_not_restricted(country):
    assert not is_restricted(country)


def test_eea_has_30_countries():
    assert len(EEA_COUNTRIES) == 30


def test_restricted_region_gets_451_without_calling_the_llm(make_client):
    client, llm = make_client([ok_step()])
    res = client.post("/api/chat", json=QUESTION, headers={"x-vercel-ip-country": "DE"})
    assert res.status_code == 451
    assert res.json()["code"] == "region_unavailable"
    assert llm.calls == []


def test_allowed_region_and_missing_header_can_chat(make_client):
    client, _ = make_client([ok_step(), ok_step()])
    assert client.post("/api/chat", json=QUESTION, headers={"x-vercel-ip-country": "JP"}).status_code == 200
    assert client.post("/api/chat", json=QUESTION).status_code == 200


def test_region_check_runs_before_rate_limit(make_client):
    client, _ = make_client(
        [ok_step()], limiter=RateLimiter(per_ip_per_minute=1, per_ip_per_day=0, global_per_minute=0)
    )
    # 地域で拒否されたリクエストはレート制限の枠を消費しない
    for _ in range(3):
        assert client.post("/api/chat", json=QUESTION, headers={"x-vercel-ip-country": "GB"}).status_code == 451
    assert client.post("/api/chat", json=QUESTION, headers={"x-vercel-ip-country": "JP"}).status_code == 200
