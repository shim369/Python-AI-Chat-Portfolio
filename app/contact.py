"""お問い合わせフォーム: reCAPTCHA v3 の検証と、SMTP（Gmail）でのメール送信。

送信者のメールアドレスは From ではなく Reply-To に入れる（Gmail は認証したアカウント以外を From にできないため）。
返信ボタンでそのまま問い合わせた人に返信できる。
"""

import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.config import Settings
from app.schemas import ContactRequest

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
# フロント（public/js/contact.js）の grecaptcha.execute に渡す action と揃える
RECAPTCHA_ACTION = "contact"
VERIFY_TIMEOUT_SECONDS = 5
SMTP_TIMEOUT_SECONDS = 10


class ContactError(Exception):
    """お問い合わせを受け付けられなかった。code はフロントが表示文言を選ぶためのキー。"""

    def __init__(self, code: str, status_code: int, message: str, detail: str = ""):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        # ログにだけ残す内部向けの詳細（Google が返したエラーコードなど）
        self.detail = detail


async def verify_recaptcha(token: str, settings: Settings) -> float:
    """トークンを Google に問い合わせて検証し、スコアを返す。不合格なら ContactError を送出する。"""
    if not token:
        raise ContactError("recaptcha_failed", 403, "reCAPTCHA token is missing")
    try:
        async with httpx.AsyncClient(timeout=VERIFY_TIMEOUT_SECONDS) as client:
            res = await client.post(
                RECAPTCHA_VERIFY_URL, data={"secret": settings.recaptcha_secret_key, "response": token}
            )
            res.raise_for_status()
            result = res.json()
    except httpx.HTTPError as e:
        raise ContactError("contact_failed", 502, "reCAPTCHA verification request failed", f"{type(e).__name__}: {e}")

    score = float(result.get("score") or 0.0)
    if not result.get("success") or result.get("action") != RECAPTCHA_ACTION or score < settings.recaptcha_min_score:
        detail = f"success={result.get('success')} action={result.get('action')} score={score} errors={result.get('error-codes')}"
        raise ContactError("recaptcha_failed", 403, "reCAPTCHA verification failed", detail)
    return score


def build_message(body: ContactRequest, settings: Settings) -> EmailMessage:
    msg = EmailMessage()
    # name は schemas.py で改行を取り除いているが、EmailMessage もヘッダーの改行を拒否する
    msg["Subject"] = f"【ポートフォリオ】お問い合わせ: {body.name}"
    msg["From"] = settings.smtp_user
    msg["To"] = settings.contact_to_email
    msg["Reply-To"] = body.email
    msg.set_content(f"お名前: {body.name}\nメールアドレス: {body.email}\n表示言語: {body.lang}\n\nお問い合わせ内容:\n{body.message}\n")
    return msg


def send_mail(msg: EmailMessage, settings: Settings) -> None:
    """同期処理。呼び出し側でスレッドに逃がす。465 は SSL、それ以外（587 など）は STARTTLS で接続する。"""
    context = ssl.create_default_context()
    try:
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(
                settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_SECONDS, context=context
            ) as smtp:
                smtp.login(settings.smtp_user, settings.smtp_pass)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
                smtp.starttls(context=context)
                smtp.login(settings.smtp_user, settings.smtp_pass)
                smtp.send_message(msg)
    except (smtplib.SMTPException, OSError) as e:
        raise ContactError("contact_failed", 502, "failed to send mail", f"{type(e).__name__}: {e}")
