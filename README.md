# Python-AI-Chat-Portfolio

[![Python-AI-Chat-Portfolio](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml/badge.svg)](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml)

自己紹介ページと、経歴について質問できる AI チャットを1ページにまとめたポートフォリオです。
バックエンドは Python (FastAPI) で、Gemini API の function calling を使ったエージェントループで回答します（Sprint 2 で実装予定）。

- デプロイ先: https://python-ai-chat-portfolio.vercel.app
- 開発の進め方とタスク: [docs/BACKLOG.md](docs/BACKLOG.md)

<!-- スクリーンショット（後で差し替え） -->
![スクリーンショット](docs/screenshot.png)

## 技術構成

| 層 | 技術 |
|---|---|
| フロントエンド | HTML / CSS / バニラ JavaScript（ビルドなし、`public/`） |
| バックエンド | Python 3.14 / FastAPI（`app/`） |
| LLM | Google Gemini API（`google-genai` SDK、デフォルトのモデルは `gemini-3.5-flash-lite`） |
| ホスティング | Vercel Hobby（無料プラン）。`public/` は CDN、`app/main.py` は Python Function |
| パッケージ管理 | uv（`pyproject.toml` + `uv.lock`） |

## ディレクトリ構成

```
app/
  main.py          FastAPI エントリポイント（/api/chat, /api/blog, /api/health）
  config.py        環境変数の読み込み
  schemas.py       リクエスト定義と入力バリデーション
  llm.py           LLM 呼び出し（Gemini）を閉じ込めるモジュール
  blog.py          TECH BLOG のトップページから最新記事を取得（RSS がないため HTML をパース）
  profile.py       profile.json / system.md の読み込み
  data/profile.json  AI が回答の根拠にする経歴データ（ここを編集すれば内容を差し替えられる）
  prompts/system.md  システムプロンプト
public/            静的ページ（スキル・制作物の表示内容は js/config.js で編集）
scripts/dev_server.py  ローカル開発用サーバー
tests/             pytest（実 API・外部サイトにはアクセスしない）
docs/BACKLOG.md    スプリントごとのタスク
```

## ローカルでの起動

前提: [uv](https://docs.astral.sh/uv/) がインストール済みであること（Python 3.14 は uv が自動で用意します）。

```bash
uv sync                      # .venv を作成して依存をインストール
cp .env.example .env         # .env に GEMINI_API_KEY を記入（.env は git 管理外）
uv run --env-file .env python scripts/dev_server.py
# → http://127.0.0.1:8000
```

Vercel と同じ環境で確認したい場合は [Vercel CLI](https://vercel.com/docs/cli) を使います（`.env` は自動で読み込まれます）。

```bash
vercel dev
```

## Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/apikey) に Google アカウントでログインする
2. 「Create API key」でキーを発行する（無料枠で使えます。クレジットカードは不要です）
3. ローカルでは `.env` に、本番では Vercel の環境変数に設定する。**コードやコミットには絶対に含めない**

## Vercel へのデプロイ（GitHub 連携）

1. [Vercel](https://vercel.com/) に GitHub アカウントでサインアップする（Hobby プラン、クレジットカード不要）
2. 「Add New… → Project」から `shim369/Python-AI-Chat-Portfolio` を Import する
3. Framework Preset は自動で FastAPI と判定されます（`pyproject.toml` の `tool.vercel.entrypoint` を参照）
4. 「Environment Variables」で次を設定してから Deploy する
   - `GEMINI_API_KEY`（必須）
   - `GEMINI_MODEL`（任意。未設定なら `gemini-3.5-flash-lite`）
5. 以降は `main` への push で本番、Pull Request でプレビューが自動でデプロイされます

環境変数を後から変更した場合は、再デプロイ（Deployments → Redeploy）が必要です。

## 利用範囲について

本サイトは就職活動用の**個人・非商用のポートフォリオ**です。広告・課金・商用サービスの要素はなく、Vercel Hobby プランと Gemini API 無料枠の範囲で運用しています。
どちらにも使用量の上限があるため、上限に達した場合は一時的にチャットが使えなくなることがあります。

## 参照した公式ドキュメント（確認日: 2026-10-27）

無料プランの仕様は変更されることがあるため、確認した時点の情報として記載します。

- Vercel Python Runtime（対応バージョン 3.12 / 3.13 / 3.14、`pyproject.toml` / `uv.lock` に対応）: https://vercel.com/docs/functions/runtimes/python
- Vercel で FastAPI をデプロイ（エントリポイント、`public/` の CDN 配信、`maxDuration`）: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Functions の制限（Hobby の最大実行時間 300 秒）: https://vercel.com/docs/functions/limitations
- Gemini API の料金（無料枠の対象モデル、無料枠の入力は製品改善に使われる）: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API のレート制限: https://ai.google.dev/gemini-api/docs/rate-limits

> 設計判断・既知の制限・今後の改善案は Sprint 3 で追記します。
