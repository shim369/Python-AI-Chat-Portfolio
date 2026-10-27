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


@lru_cache
def build_system_prompt() -> str:
    profile = load_profile()
    template = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    # JSON に波括弧が含まれるため str.format ではなく置換で埋め込む
    return template.replace("{name}", profile["basics"]["name"]).replace(
        "{profile_json}", json.dumps(profile, ensure_ascii=False, indent=2)
    )
