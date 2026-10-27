"""ローカル開発用サーバー（本番の Vercel では使わない）。

本番では public/ を Vercel の CDN が配信するため、app/main.py では静的ファイルを扱わない。
ローカルで vercel dev を使わずに確認できるよう、ここでだけ public/ をマウントする。

    uv run python scripts/dev_server.py
"""

import sys
from pathlib import Path

import uvicorn
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402

app.mount("/", StaticFiles(directory=ROOT / "public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
