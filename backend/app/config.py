"""環境変数から読み込む設定値。

Vercel Hobby の関数最大実行時間 (vercel.json の maxDuration=60s) に収まるよう、
タイムアウト・出力トークン数・エージェントの反復回数と時間予算はデフォルトで小さめにしている。
"""

import os
from dataclasses import dataclass


def _int_env(name: str, default: int) -> int:
    value = os.environ.get(name, "").strip()
    return int(value) if value else default


def _float_env(name: str, default: float) -> float:
    value = os.environ.get(name, "").strip()
    return float(value) if value else default


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_model: str
    # Gemini 1 回あたりの HTTP タイムアウト（秒）
    llm_timeout_seconds: int
    max_output_tokens: int
    max_input_chars: int
    max_history: int
    # エージェントループの最大反復回数と、1 リクエスト全体の時間予算（秒）
    agent_max_iterations: int
    agent_budget_seconds: int
    # 一時的なエラー (5xx / 通信エラー) のリトライ回数（時間予算の範囲内でのみ行う）
    llm_max_retries: int
    # レート制限（0 で無効）。Gemini 無料枠を使い切らないよう保守的な値にしている
    rate_limit_per_ip_per_minute: int
    rate_limit_per_ip_per_day: int
    rate_limit_global_per_minute: int
    # お問い合わせフォーム: 送信先と送信に使う SMTP サーバー（Gmail はアプリパスワードを使う）
    contact_to_email: str
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_pass: str
    # reCAPTCHA v3 のシークレットキー（未設定なら検証しない。ローカル開発用）と、合格とするスコアの下限
    recaptcha_secret_key: str
    recaptcha_min_score: float
    # お問い合わせのレート制限（0 で無効）。迷惑メールの踏み台にならないよう AI チャットより厳しくしている
    contact_rate_limit_per_ip_per_minute: int
    contact_rate_limit_per_ip_per_day: int
    contact_rate_limit_global_per_minute: int

    @property
    def contact_enabled(self) -> bool:
        return bool(self.contact_to_email and self.smtp_host and self.smtp_user and self.smtp_pass)


def get_settings() -> Settings:
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        gemini_model=os.environ.get("GEMINI_MODEL", "").strip() or "gemini-3.5-flash-lite",
        llm_timeout_seconds=_int_env("LLM_TIMEOUT_SECONDS", 15),
        max_output_tokens=_int_env("MAX_OUTPUT_TOKENS", 1024),
        max_input_chars=_int_env("MAX_INPUT_CHARS", 500),
        max_history=_int_env("MAX_HISTORY", 10),
        agent_max_iterations=_int_env("AGENT_MAX_ITERATIONS", 4),
        agent_budget_seconds=_int_env("AGENT_BUDGET_SECONDS", 40),
        llm_max_retries=_int_env("LLM_MAX_RETRIES", 2),
        rate_limit_per_ip_per_minute=_int_env("RATE_LIMIT_PER_IP_PER_MINUTE", 5),
        rate_limit_per_ip_per_day=_int_env("RATE_LIMIT_PER_IP_PER_DAY", 40),
        rate_limit_global_per_minute=_int_env("RATE_LIMIT_GLOBAL_PER_MINUTE", 10),
        contact_to_email=os.environ.get("CONTACT_TO_EMAIL", "").strip(),
        smtp_host=os.environ.get("SMTP_HOST", "").strip() or "smtp.gmail.com",
        smtp_port=_int_env("SMTP_PORT", 465),
        smtp_user=os.environ.get("SMTP_USER", "").strip(),
        smtp_pass=os.environ.get("SMTP_PASS", "").strip(),
        recaptcha_secret_key=os.environ.get("RECAPTCHA_SECRET_KEY", "").strip(),
        recaptcha_min_score=_float_env("RECAPTCHA_MIN_SCORE", 0.5),
        contact_rate_limit_per_ip_per_minute=_int_env("CONTACT_RATE_LIMIT_PER_IP_PER_MINUTE", 2),
        contact_rate_limit_per_ip_per_day=_int_env("CONTACT_RATE_LIMIT_PER_IP_PER_DAY", 10),
        contact_rate_limit_global_per_minute=_int_env("CONTACT_RATE_LIMIT_GLOBAL_PER_MINUTE", 10),
    )
