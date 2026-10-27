"""FastAPI エントリポイント（Vercel は pyproject.toml の tool.vercel.entrypoint からこの app を読み込む）。

静的ファイル (public/) は Vercel の CDN が配信するため、ここではマウントしない。
"""

import json
from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse

from app.agent import AgentLimits, run_agent
from app.blog import BLOG_URL, fetch_latest_posts
from app.config import get_settings
from app.llm import GeminiClient, LLMClient, LLMError
from app.profile import build_system_prompt
from app.schemas import ChatRequest, InputError
from app.tools import TOOL_SPECS

app = FastAPI(title="Python-AI-Chat-Portfolio", docs_url=None, redoc_url=None)

EMPTY_REPLY = {
    "ja": "すみません、うまく回答を生成できませんでした。質問を変えてお試しください。",
    "en": "Sorry, I couldn't generate an answer. Please try rephrasing your question.",
}


def get_llm_client() -> LLMClient:
    # 非同期クライアントはイベントループに紐づくため、リクエストごとに生成する（生成コストは小さい）
    return GeminiClient(get_settings())


@app.exception_handler(LLMError)
async def handle_llm_error(request: Request, exc: LLMError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "detail": exc.user_message})


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # pydantic のエラーから、ユーザー向けに定義した InputError だけを取り出す
    code, message = "invalid_input", "入力内容が正しくありません。"
    for err in exc.errors():
        ctx_error = err.get("ctx", {}).get("error")
        if isinstance(ctx_error, InputError):
            code, message = ctx_error.code, str(ctx_error)
            break
    return JSONResponse(status_code=422, content={"code": code, "detail": message})


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/blog")
async def blog(response: Response) -> dict:
    try:
        posts = [p.to_dict() for p in await fetch_latest_posts()]
    except Exception:
        posts = []
    # Vercel の CDN にキャッシュさせ、関数の実行回数とブログ側への負荷を抑える
    if posts:
        response.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
    else:
        response.headers["Cache-Control"] = "public, s-maxage=300"
    return {"blog_url": BLOG_URL, "posts": posts}


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/chat")
async def chat(body: ChatRequest, llm: LLMClient = Depends(get_llm_client)) -> StreamingResponse:
    """エージェントループの進行を SSE で返す（event: tool / delta / notice / done / error）。

    入力エラーや設定エラーはストリーム開始前に JSON で返る。開始後のエラーは error イベントで返す。
    """
    settings = get_settings()
    limits = AgentLimits(
        max_iterations=settings.agent_max_iterations,
        budget_seconds=settings.agent_budget_seconds,
        llm_timeout_seconds=settings.llm_timeout_seconds,
    )

    async def events() -> AsyncIterator[str]:
        answered = False
        try:
            async for event in run_agent(llm, build_system_prompt(body.lang), body.messages, TOOL_SPECS, limits):
                if event.type == "delta":
                    answered = True
                elif event.type == "done" and not answered:
                    yield _sse("delta", {"text": EMPTY_REPLY[body.lang]})
                yield _sse(event.type, event.data)
        except LLMError as e:
            yield _sse("error", {"code": e.code, "detail": e.user_message})
        except Exception:
            yield _sse("error", {"code": LLMError.code, "detail": LLMError.user_message})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        # 途中のプロキシやブラウザでバッファ・キャッシュされないようにする
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
