"""FastAPI エントリポイント（Vercel は pyproject.toml の tool.vercel.entrypoint からこの app を読み込む）。

静的ファイル (public/) は Vercel の CDN が配信するため、ここではマウントしない。
"""

import json
import time
from collections.abc import AsyncIterator
from functools import lru_cache

from fastapi import Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse

from app.agent import AgentLimits, AgentStats, run_agent
from app.blog import BLOG_URL, fetch_latest_posts
from app.config import get_settings
from app.llm import GeminiClient, LLMClient, LLMError
from app.logging_utils import anonymize_ip, log_event, new_request_id
from app.profile import build_system_prompt
from app.rate_limit import RateLimiter
from app.schemas import ChatRequest, InputError
from app.tools import TOOL_SPECS

app = FastAPI(title="Python-AI-Chat-Portfolio", docs_url=None, redoc_url=None)

EMPTY_REPLY = {
    "ja": "すみません、うまく回答を生成できませんでした。質問を変えてお試しください。",
    "en": "Sorry, I couldn't generate an answer. Please try rephrasing your question.",
}


class TooManyRequestsError(Exception):
    """このサーバー自身のレート制限に当たった（Gemini 側の 429 とは区別する）。"""

    def __init__(self, limit_name: str):
        self.limit_name = limit_name


def get_request_id(request: Request) -> str:
    request.state.request_id = new_request_id()
    return request.state.request_id


def client_ip(request: Request) -> str:
    # Vercel はクライアント IP を x-real-ip / x-forwarded-for に設定する
    forwarded = request.headers.get("x-real-ip") or request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


@lru_cache
def get_rate_limiter() -> RateLimiter:
    settings = get_settings()
    return RateLimiter(
        per_ip_per_minute=settings.rate_limit_per_ip_per_minute,
        per_ip_per_day=settings.rate_limit_per_ip_per_day,
        global_per_minute=settings.rate_limit_global_per_minute,
    )


def enforce_rate_limit(
    request: Request,
    request_id: str = Depends(get_request_id),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> None:
    limit_name = limiter.check(client_ip(request))
    if limit_name:
        log_event(
            "chat_rate_limited",
            level="warning",
            request_id=request_id,
            limit=limit_name,
            client=anonymize_ip(client_ip(request)),
        )
        raise TooManyRequestsError(limit_name)


def get_llm_client() -> LLMClient:
    # 非同期クライアントはイベントループに紐づくため、リクエストごとに生成する（生成コストは小さい）
    return GeminiClient(get_settings())


@app.exception_handler(TooManyRequestsError)
async def handle_too_many_requests(request: Request, exc: TooManyRequestsError) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"code": "too_many_requests", "detail": "リクエストが多すぎます。しばらく待ってから再試行してください。"},
        headers={"Retry-After": "60"},
    )


@app.exception_handler(LLMError)
async def handle_llm_error(request: Request, exc: LLMError) -> JSONResponse:
    log_event(
        "chat_failed",
        level="error",
        request_id=getattr(request.state, "request_id", None),
        error_code=exc.code,
        error=f"{type(exc).__name__}: {exc}",
    )
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
    log_event("chat_rejected", level="warning", path=request.url.path, error_code=code)
    return JSONResponse(status_code=422, content={"code": code, "detail": message})


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/blog")
async def blog(response: Response) -> dict:
    try:
        posts = [p.to_dict() for p in await fetch_latest_posts()]
    except Exception as e:
        log_event("blog_fetch_failed", level="warning", error=f"{type(e).__name__}: {e}")
        posts = []
    # Vercel の CDN にキャッシュさせ、関数の実行回数とブログ側への負荷を抑える
    if posts:
        response.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
    else:
        response.headers["Cache-Control"] = "public, s-maxage=300"
    return {"blog_url": BLOG_URL, "posts": posts}


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/chat", dependencies=[Depends(enforce_rate_limit)])
async def chat(
    body: ChatRequest,
    request_id: str = Depends(get_request_id),
    llm: LLMClient = Depends(get_llm_client),
) -> StreamingResponse:
    """エージェントループの進行を SSE で返す（event: tool / delta / notice / done / error）。

    入力エラー・レート制限・設定エラーはストリーム開始前に JSON で返る。開始後のエラーは error イベントで返す。
    """
    settings = get_settings()
    limits = AgentLimits(
        max_iterations=settings.agent_max_iterations,
        budget_seconds=settings.agent_budget_seconds,
        llm_timeout_seconds=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
    )
    stats = AgentStats()
    started = time.monotonic()

    async def events() -> AsyncIterator[str]:
        answered_chars = 0
        outcome, error = "ok", None
        try:
            async for event in run_agent(
                llm, build_system_prompt(body.lang), body.messages, TOOL_SPECS, limits, stats
            ):
                if event.type == "delta":
                    answered_chars += len(event.data["text"])
                elif event.type == "notice":
                    outcome = event.data["code"]
                elif event.type == "done":
                    if not answered_chars:
                        outcome = "empty_reply"
                        yield _sse("delta", {"text": EMPTY_REPLY[body.lang]})
                    event.data["request_id"] = request_id
                yield _sse(event.type, event.data)
        except LLMError as e:
            outcome, error = e.code, f"{type(e).__name__}: {e}"
            yield _sse("error", {"code": e.code, "detail": e.user_message, "request_id": request_id})
        except Exception as e:
            outcome, error = LLMError.code, f"{type(e).__name__}: {e}"
            yield _sse("error", {"code": LLMError.code, "detail": LLMError.user_message, "request_id": request_id})
        finally:
            # 発言本文・回答本文は残さず、件数や文字数などのメタ情報だけを記録する
            log_event(
                "chat_completed",
                level="error" if error else "info",
                request_id=request_id,
                outcome=outcome,
                duration_ms=round((time.monotonic() - started) * 1000),
                model=settings.gemini_model,
                lang=body.lang,
                messages=len(body.messages),
                input_chars=len(body.messages[-1].text),
                answer_chars=answered_chars,
                iterations=stats.iterations,
                retries=stats.retries,
                tools=stats.tools,
                usage=stats.usage,
                error=error,
            )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        # 途中のプロキシやブラウザでバッファ・キャッシュされないようにする
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-Request-ID": request_id},
    )
