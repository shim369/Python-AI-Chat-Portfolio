"""環境変数から読み込む設定値。

Vercel Hobby の関数最大実行時間 (vercel.json の maxDuration=60s) に収まるよう、
タイムアウト・出力トークン数・エージェントの反復回数と時間予算はデフォルトで小さめにしている。
"""

import os
from dataclasses import dataclass


def _int_env(name: str, default: int) -> int:
    value = os.environ.get(name, "").strip()
    return int(value) if value else default


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
    )
