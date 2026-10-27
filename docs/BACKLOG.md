# BACKLOG

Python-AI-Chat-Portfolio の開発タスク。スプリント単位で管理する。

## Sprint 1: 静的ページ + 非ストリーミングのチャットAPI

- [x] Python 3.14 固定（`.python-version` / `requires-python`。Vercel 対応版の最新）
- [x] `vercel.json`（maxDuration、関数バンドルからの除外設定）
- [x] `.env.example`（変数名のみ）
- [x] 1ページ構成の静的ページ（ヒーロー / スキル / 制作物 / 技術解説 / チャット / フッター）
- [x] レスポンシブ・ダークモード対応
- [x] `profile.json` と `prompts/system.md`
- [x] `POST /api/chat`（非ストリーミング、ステートレス）
- [x] LLM 呼び出しを `app/llm.py` に分離（`LLMClient` プロトコル）
- [x] 入力長・履歴件数のバリデーション、日本語エラーメッセージ
- [x] チャットUI（吹き出し、ローディング、再試行、Enter送信、サンプル質問チップ、注意書き）
- [x] ローカル開発サーバー（`scripts/dev_server.py`）
- [x] ローカルで Gemini 実接続を確認（`gemini-3.5-flash-lite`）
- [x] GitHub へ push
- [x] Vercel に GitHub 連携でデプロイし、`GEMINI_API_KEY` を設定
- [x] Vercel 上で uv（pyproject.toml / uv.lock）の依存解決と Python 3.14 をビルドログで確認
- [x] 本番 URL でページ表示とチャット応答を確認

## 追加タスク（Sprint 1 後）

- [x] Blog セクション: TECH BLOG の最新3記事をカード表示（`GET /api/blog` がトップページを取得・パース、CDN に1時間キャッシュ）
- [x] ブログのパーサーのテスト（`tests/test_blog.py`）
- [x] 本番 URL で Blog セクションの表示を確認
- [x] 日本語 / 英語の切り替え（ヘッダーの JA / EN。文言は `public/js/i18n.js`、AI の回答言語はリクエストの `lang` で指定）
- [x] 本番 URL で言語切り替えを確認

## Sprint 2: ストリーミング + エージェントループ

- [x] ツール関数（get_skills / get_projects / get_experience / get_contact_info / get_site_info / get_blog_posts）
- [x] JSON Schema によるツールスキーマ定義（FunctionDeclaration に変換）
- [x] LLM 呼び出しをプロバイダ非依存の型（ToolSpec / ModelTurn など）で抽象化し、ストリーミングに対応
- [x] 手動エージェントループ（最大4回、全体40秒の予算、最後の反復はツール禁止）
- [x] SSE によるストリーミング応答（event: tool / delta / notice / done / error）
- [x] フロントでツール呼び出しバッジ表示（例: 🔧 get_projects を実行）
- [x] 時間切れ時の部分回答と案内表示
- [x] ブログ記事のメモリ内キャッシュ（ツールからの再取得を抑える）
- [x] Vercel プレビュー URL で逐次表示と実行時間を実機確認 → バッファされず逐次到達（tool イベント 2.1s → delta 5.0s → done 5.3s）。フォールバック不要

## Sprint 3: 運用・品質

- [x] JSON 構造化ログ（リクエストID、所要時間、ツール名、トークン使用量、エラー。本文は残さない）
- [x] リクエストIDをレスポンスヘッダー・SSE・画面のエラー表示に出し、ログと突き合わせられるようにする
- [x] IP 単位のメモリ内レート制限（分・日・インスタンス全体。環境変数で調整）
- [x] 429 / 5xx の扱い（日本語・英語のメッセージ、5xx は時間予算内で指数バックオフ最大2回）
- [x] pytest（ツール、エージェントループ（モック）、入力バリデーション、API / SSE、レート制限、ブログのパーサー）
- [x] GitHub Actions（setup-uv → `uv sync --locked` → `uv run pytest`）
- [x] README 完成（設計判断、既知の制限、改善案、確認日と参照URL）
- [ ] GitHub Actions が main で成功することを確認
- [ ] 本番でログ（Vercel Runtime Logs）とレート制限を確認
