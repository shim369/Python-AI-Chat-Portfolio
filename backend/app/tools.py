"""エージェントが呼び出すツール。

各ツールは Python の関数として実装し、データは profile.json（ブログのみ外部サイト）から返す。
TOOL_SPECS は LLM に渡すスキーマ（JSON Schema）で、関数の引数と一致させる。
"""

import inspect
from collections.abc import Awaitable, Callable
from typing import Any

from app.blog import fetch_latest_posts
from app.llm import ToolSpec
from app.profile import load_profile

ToolResult = dict[str, Any]


def get_skills(category: str | None = None) -> ToolResult:
    skills = load_profile()["skills"]
    if category:
        skills = [s for s in skills if category.lower() in s["category"].lower()]
    return {"skills": skills}


def get_projects(technology: str | None = None) -> ToolResult:
    projects = load_profile()["projects"]
    if technology:
        projects = [p for p in projects if any(technology.lower() in t.lower() for t in p["technologies"])]
    return {"projects": projects}


def get_experience() -> ToolResult:
    profile = load_profile()
    return {"basics": profile["basics"], "experience": profile["experience"]}


def get_contact_info() -> ToolResult:
    return {"contact": load_profile()["contact"]}


def get_site_info() -> ToolResult:
    return {"site": load_profile()["site"]}


async def get_blog_posts(limit: int = 3) -> ToolResult:
    posts = await fetch_latest_posts(limit=max(1, min(int(limit), 3)))
    return {"posts": [p.to_dict() for p in posts]}


_NO_PARAMS: dict[str, Any] = {"type": "object", "properties": {}}

TOOL_SPECS: list[ToolSpec] = [
    ToolSpec(
        name="get_skills",
        description="スキル一覧（名前・カテゴリ・経験年数・詳細）を返す。category を指定すると、そのカテゴリを含むものに絞り込む。",
        parameters={
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "絞り込むカテゴリ（例: 言語, フロントエンド, AI）。省略すると全件。",
                }
            },
        },
    ),
    ToolSpec(
        name="get_projects",
        description="制作物の一覧（タイトル・概要・使用技術・URL）を返す。technology を指定すると、その技術を使った制作物に絞り込む。",
        parameters={
            "type": "object",
            "properties": {
                "technology": {
                    "type": "string",
                    "description": "絞り込む技術名（例: Python, FastAPI）。省略すると全件。",
                }
            },
        },
    ),
    ToolSpec(
        name="get_experience",
        description="基本情報（名前・肩書き・概要）と職歴を返す。",
        parameters=_NO_PARAMS,
    ),
    ToolSpec(
        name="get_contact_info",
        description="連絡先（メール・GitHub など）を返す。",
        parameters=_NO_PARAMS,
    ),
    ToolSpec(
        name="get_site_info",
        description="このポートフォリオサイトと AI チャットの仕組み（技術構成）の説明を返す。",
        parameters=_NO_PARAMS,
    ),
    ToolSpec(
        name="get_blog_posts",
        description="技術ブログ「TECH BLOG」の最新記事（タイトル・URL・投稿日）を新しい順に返す。",
        parameters={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "取得する件数（1〜3）。省略すると3件。",
                    "minimum": 1,
                    "maximum": 3,
                }
            },
        },
    ),
]

_FUNCTIONS: dict[str, Callable[..., ToolResult | Awaitable[ToolResult]]] = {
    "get_skills": get_skills,
    "get_projects": get_projects,
    "get_experience": get_experience,
    "get_contact_info": get_contact_info,
    "get_site_info": get_site_info,
    "get_blog_posts": get_blog_posts,
}


async def execute_tool(name: str, args: dict[str, Any]) -> ToolResult:
    """ツールを実行する。失敗しても例外は投げず、エラー内容を結果として LLM に返す。"""
    func = _FUNCTIONS.get(name)
    if func is None:
        return {"error": f"unknown tool: {name}"}
    # モデルが想定外の引数を付けてきても落ちないよう、関数の引数だけを渡す
    params = inspect.signature(func).parameters
    kwargs = {k: v for k, v in args.items() if k in params}
    try:
        result = func(**kwargs)
        if inspect.isawaitable(result):
            result = await result
        return result
    except Exception as e:
        return {"error": f"{type(e).__name__}: tool failed"}
