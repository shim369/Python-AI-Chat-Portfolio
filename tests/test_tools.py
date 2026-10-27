import asyncio

import pytest

from app import tools
from app.blog import BlogPost
from app.profile import load_profile
from app.tools import TOOL_SPECS, execute_tool


def run(coro):
    return asyncio.run(coro)


def test_every_spec_has_a_function_with_matching_parameters():
    import inspect

    for spec in TOOL_SPECS:
        func = getattr(tools, spec.name)
        params = set(inspect.signature(func).parameters)
        assert set(spec.parameters["properties"]) == params, spec.name


def test_get_skills_returns_all_and_filters_by_category():
    all_skills = run(execute_tool("get_skills", {}))["skills"]
    assert len(all_skills) == len(load_profile()["skills"])

    ai_skills = run(execute_tool("get_skills", {"category": "ai"}))["skills"]
    assert ai_skills and all("ai" in s["category"].lower() for s in ai_skills)


def test_get_projects_filters_by_technology_case_insensitively():
    projects = run(execute_tool("get_projects", {"technology": "fastapi"}))["projects"]
    assert [p["title"] for p in projects] == ["Python-AI-Chat-Portfolio"]


def test_profile_tools_return_their_sections():
    profile = load_profile()
    assert run(execute_tool("get_experience", {})) == {"basics": profile["basics"], "experience": profile["experience"]}
    assert run(execute_tool("get_contact_info", {})) == {"contact": profile["contact"]}
    assert run(execute_tool("get_site_info", {})) == {"site": profile["site"]}


def test_get_blog_posts_clamps_limit(monkeypatch: pytest.MonkeyPatch):
    requested = []

    async def fake_fetch(limit: int = 3):
        requested.append(limit)
        return [BlogPost(title="t", url="u", date="2026-01-01", category="read", image="")]

    monkeypatch.setattr(tools, "fetch_latest_posts", fake_fetch)
    result = run(execute_tool("get_blog_posts", {"limit": 10.0}))
    assert requested == [3]
    assert result["posts"][0]["title"] == "t"


def test_execute_tool_ignores_unexpected_arguments():
    result = run(execute_tool("get_contact_info", {"unexpected": True}))
    assert "contact" in result


def test_execute_tool_reports_unknown_tool_and_failures(monkeypatch: pytest.MonkeyPatch):
    assert run(execute_tool("no_such_tool", {})) == {"error": "unknown tool: no_such_tool"}

    async def broken(limit: int = 3):
        raise RuntimeError("down")

    monkeypatch.setattr(tools, "fetch_latest_posts", broken)
    assert run(execute_tool("get_blog_posts", {})) == {"error": "RuntimeError: tool failed"}
