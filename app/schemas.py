"""API のリクエスト/レスポンス定義と入力バリデーション。"""

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings


Lang = Literal["ja", "en"]


class InputError(ValueError):
    """ユーザー向けの入力エラー。code はフロントが表示文言を選ぶためのキー。"""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


# AI 側の発言もクライアントから送られてくるため、過大な入力を防ぐ上限を設ける
MAX_MODEL_TEXT_CHARS = 4000


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    text: str = Field(min_length=1, max_length=MAX_MODEL_TEXT_CHARS)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    # 回答言語（画面の表示言語に合わせる）
    lang: Lang = "ja"

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        settings = get_settings()
        if messages[-1].role != "user":
            raise InputError("invalid_input", "最後のメッセージはユーザーの発言である必要があります。")
        for m in messages:
            if m.role == "user" and len(m.text) > settings.max_input_chars:
                raise InputError("input_too_long", f"質問は{settings.max_input_chars}文字以内で入力してください。")
        # 履歴は直近 N 件に制限（クライアント側でも制限しているが、サーバーでも保証する）
        trimmed = messages[-settings.max_history :]
        # 会話は必ずユーザーの発言から始める
        while trimmed[0].role != "user":
            trimmed = trimmed[1:]
        return trimmed



# お問い合わせフォームの入力上限
MAX_CONTACT_NAME_CHARS = 100
MAX_CONTACT_EMAIL_CHARS = 254
MAX_CONTACT_MESSAGE_CHARS = 2000
# 厳密な RFC 準拠ではなく、明らかな誤入力とヘッダーインジェクション（改行）を弾くための簡易チェック
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str
    # reCAPTCHA v3 のトークン（サーバーにシークレットキーが設定されているときだけ検証する）
    recaptcha_token: str = Field(default="", max_length=4096)
    lang: Lang = "ja"

    @field_validator("name")
    @classmethod
    def validate_name(cls, name: str) -> str:
        # 件名に使うので改行は空白に置き換える
        name = " ".join(name.split())
        if not name:
            raise InputError("name_required", "お名前を入力してください。")
        if len(name) > MAX_CONTACT_NAME_CHARS:
            raise InputError("name_too_long", f"お名前は{MAX_CONTACT_NAME_CHARS}文字以内で入力してください。")
        return name

    @field_validator("email")
    @classmethod
    def validate_email(cls, email: str) -> str:
        email = email.strip()
        if not email:
            raise InputError("email_required", "メールアドレスを入力してください。")
        if len(email) > MAX_CONTACT_EMAIL_CHARS or not EMAIL_PATTERN.match(email):
            raise InputError("invalid_email", "メールアドレスの形式が正しくありません。")
        return email

    @field_validator("message")
    @classmethod
    def validate_message(cls, message: str) -> str:
        message = message.strip()
        if not message:
            raise InputError("message_required", "お問い合わせ内容を入力してください。")
        if len(message) > MAX_CONTACT_MESSAGE_CHARS:
            raise InputError(
                "message_too_long", f"お問い合わせ内容は{MAX_CONTACT_MESSAGE_CHARS}文字以内で入力してください。"
            )
        return message
