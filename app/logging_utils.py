"""JSON 形式の構造化ログ。

Vercel のログ画面（Runtime Logs）で確認できるよう、1 行 1 JSON で標準出力に書く。
ユーザーの発言本文やAIの回答は個人情報を含みうるため、ログには残さない（文字数などのメタ情報のみ）。
"""

import hashlib
import json
import sys
import time
import uuid
from typing import Any


def new_request_id() -> str:
    return uuid.uuid4().hex[:16]


def anonymize_ip(ip: str) -> str:
    """IP アドレスはそのまま残さず、レート制限の調査に使える程度の短いハッシュにする。"""
    return hashlib.sha256(ip.encode()).hexdigest()[:12] if ip else ""


def log_event(event: str, level: str = "info", **fields: Any) -> None:
    record = {"ts": round(time.time(), 3), "level": level, "event": event, **fields}
    print(json.dumps(record, ensure_ascii=False, default=str), file=sys.stdout, flush=True)
