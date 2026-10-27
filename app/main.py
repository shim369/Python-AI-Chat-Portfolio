"""FastAPI エントリポイント（Vercel は pyproject.toml の tool.vercel.entrypoint からこの app を読み込む）。

静的ファイル (public/) は Vercel の CDN が配信するため、ここではマウントしない。
"""

from functools import lru_cache

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.llm import GeminiClient, LLMClient, LLMError
from app.profile import build_system_prompt
from app.schemas import ChatRequest, ChatResponse

app = FastAPI(title="Python-AI-Chat-Portfolio", docs_url=None, redoc_url=None)


@lru_cache
def _gemini_client() -> GeminiClient:
    return GeminiClient(get_settings())


def get_llm_client() -> LLMClient:
    return _gemini_client()


@app.exception_handler(LLMError)
async def handle_llm_error(request: Request, exc: LLMError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.user_message})


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # pydantic のエラーから、ユーザー向けに書いたメッセージ（ValueError）だけを取り出す
    message = "入力内容が正しくありません。"
    for err in exc.errors():
        ctx_error = err.get("ctx", {}).get("error")
        if isinstance(ctx_error, ValueError):
            message = str(ctx_error)
            break
    return JSONResponse(status_code=422, content={"detail": message})


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, llm: LLMClient = Depends(get_llm_client)) -> ChatResponse:
    result = await llm.generate(build_system_prompt(), body.messages)
    reply = result.text.strip() or "すみません、うまく回答を生成できませんでした。質問を変えてお試しください。"
    return ChatResponse(reply=reply)
