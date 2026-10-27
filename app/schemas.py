"""API のリクエスト/レスポンス定義と入力バリデーション。"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings


# AI 側の発言もクライアントから送られてくるため、過大な入力を防ぐ上限を設ける
MAX_MODEL_TEXT_CHARS = 4000


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    text: str = Field(min_length=1, max_length=MAX_MODEL_TEXT_CHARS)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        settings = get_settings()
        if messages[-1].role != "user":
            raise ValueError("最後のメッセージはユーザーの発言である必要があります。")
        for m in messages:
            if m.role == "user" and len(m.text) > settings.max_input_chars:
                raise ValueError(f"質問は{settings.max_input_chars}文字以内で入力してください。")
        # 履歴は直近 N 件に制限（クライアント側でも制限しているが、サーバーでも保証する）
        trimmed = messages[-settings.max_history :]
        # 会話は必ずユーザーの発言から始める
        while trimmed[0].role != "user":
            trimmed = trimmed[1:]
        return trimmed


class ChatResponse(BaseModel):
    reply: str
