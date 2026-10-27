"""環境変数から読み込む設定値。

Vercel Hobby の関数最大実行時間 (vercel.json の maxDuration=60s) に収まるよう、
タイムアウトや出力トークン数はデフォルトで小さめにしている。
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


def get_settings() -> Settings:
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        gemini_model=os.environ.get("GEMINI_MODEL", "").strip() or "gemini-3.5-flash-lite",
        llm_timeout_seconds=_int_env("LLM_TIMEOUT_SECONDS", 15),
        max_output_tokens=_int_env("MAX_OUTPUT_TOKENS", 1024),
        max_input_chars=_int_env("MAX_INPUT_CHARS", 500),
        max_history=_int_env("MAX_HISTORY", 10),
    )
