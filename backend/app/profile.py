"""profile.json とシステムプロンプトの読み込み。

Vercel では作業ディレクトリがプロジェクトルートになるため、
このファイルの位置を基準にパスを解決する。
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

APP_DIR = Path(__file__).resolve().parent
PROFILE_PATH = APP_DIR / "data" / "profile.json"
SYSTEM_PROMPT_PATH = APP_DIR / "prompts" / "system.md"


@lru_cache
def load_profile() -> dict[str, Any]:
    profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    profile.pop("_comment", None)
    return profile


# 回答言語ごとの指定（ツールが返すデータは日本語のまま、英語の場合は AI が訳して答える）
LANGUAGE_NAMES = {"ja": "日本語", "en": "英語 (English)"}


@lru_cache
def build_system_prompt(lang: str = "ja") -> str:
    profile = load_profile()
    template = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    # 経歴データはプロンプトに埋め込まず、エージェントがツール経由で取得する
    return template.replace("{name}", profile["basics"]["name"]).replace("{language}", LANGUAGE_NAMES[lang])
