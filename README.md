# Python-AI-Chat-Portfolio

[![Python-AI-Chat-Portfolio](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml/badge.svg)](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml)

自己紹介ページと、経歴について質問できる AI チャットを1ページにまとめたポートフォリオです。
バックエンドは Python (FastAPI) で、Gemini API の function calling を使った**手書きのエージェントループ**が、ツール（経歴データ・ブログ記事の取得）を呼びながら回答し、その過程を SSE でストリーミング表示します。

- デプロイ先: https://python-ai-chat-portfolio.vercel.app
- 開発の進め方とタスク: [docs/BACKLOG.md](docs/BACKLOG.md)（3 スプリント + 追加タスク）

## 主な機能

- 1ページの自己紹介（スキル / 制作物 / ブログ最新記事 / このサイトの仕組み / AI チャット）、レスポンシブ・ダークモード対応
- 日本語 / 英語の切り替え（画面の文言・AI の回答言語・エラーメッセージ）
- AI チャット
  - Gemini の function calling による手動エージェントループ（最大反復回数・時間予算つき）
  - 呼び出したツールをバッジで表示（例: 🔧 get_projects を実行）し、回答を SSE で逐次表示
  - 経歴データ (`profile.json`) に無いことは「分かりません」と答え、推測で経歴を作らない
- 運用面: JSON 構造化ログ、IP 単位のレート制限、入力長の上限、一時的エラーのリトライ、提供地域の制御、pytest + GitHub Actions

## 技術構成

| 層 | 技術 |
|---|---|
| フロントエンド | HTML / CSS / バニラ JavaScript（ビルドなし、`public/`） |
| バックエンド | Python 3.14 / FastAPI（`app/`） |
| LLM | Google Gemini API（`google-genai` SDK、デフォルトのモデルは `gemini-3.5-flash-lite`） |
| ホスティング | Vercel Hobby（無料プラン）。`public/` は CDN、`app/main.py` は Python Function |
| パッケージ管理 | uv（`pyproject.toml` + `uv.lock`） |
| テスト / CI | pytest / GitHub Actions（`astral-sh/setup-uv`） |

```
Browser ──(GET 静的ファイル)──▶ Vercel CDN (public/)
   │
   └─(POST /api/chat, SSE)──▶ FastAPI (Vercel Python Function)
                                 ├─ 提供地域の制御 / レート制限 / 入力バリデーション
                                 ├─ agent.py: エージェントループ ──▶ llm.py ──▶ Gemini API
                                 │      └─ tools.py ──▶ profile.json / TECH BLOG
                                 └─ 構造化ログ (stdout → Vercel Runtime Logs)
```

## ディレクトリ構成

```
app/
  main.py            FastAPI エントリポイント（/api/chat, /api/blog, /api/health）、レート制限、ログ
  agent.py           手動エージェントループ（関数呼び出し → 実行 → 結果返却の繰り返し、リトライ、時間予算）
  tools.py           エージェントのツール（Python 関数）と JSON Schema
  llm.py             LLM 呼び出しを閉じ込めるモジュール（プロバイダ非依存の型 + Gemini 実装）
  schemas.py         リクエスト定義と入力バリデーション
  config.py          環境変数の読み込み（上限値はすべてここで調整）
  rate_limit.py      メモリ内のスライディングウィンドウ式レート制限
  region.py          AI チャットの提供地域の制御（EEA・スイス・英国では提供しない）
  logging_utils.py   JSON 構造化ログ
  blog.py            TECH BLOG のトップページから最新記事を取得（RSS がないため HTML をパース）
  profile.py         profile.json / system.md の読み込み
  data/profile.json  AI が回答の根拠にする経歴データ（ここを編集すれば内容を差し替えられる）
  prompts/system.md  システムプロンプト
public/              静的ページ（スキル・制作物の表示内容は js/config.js、画面の文言は js/i18n.js で編集）
scripts/dev_server.py  ローカル開発用サーバー（public/ もまとめて配信）
tests/               pytest（実 API・外部サイトにはアクセスしない）
docs/BACKLOG.md      スプリントごとのタスク
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

テスト（API キー不要。Gemini API・外部サイトにはアクセスしません）:

```bash
uv run pytest
```

> pyenv を使っている場合、このディレクトリでは `.python-version` (3.14) が参照されます。コマンドは `uv run` 経由で実行してください。

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
   - そのほかは任意（下の「環境変数」を参照）
5. 以降は `main` への push で本番、その他のブランチや Pull Request でプレビューが自動でデプロイされます

環境変数を後から変更した場合は、再デプロイ（Deployments → Redeploy）が必要です。
プレビュー環境は Vercel Authentication で保護されます。CLI からは `vercel curl <URL>` でアクセスできます。

## 環境変数

`GEMINI_API_KEY` 以外はすべて任意で、未設定時は `app/config.py` のデフォルト値を使います（一覧は `.env.example`）。

| 変数 | デフォルト | 内容 |
|---|---|---|
| `GEMINI_API_KEY` | （必須） | Gemini API キー |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | 使用するモデル |
| `LLM_TIMEOUT_SECONDS` | 15 | Gemini 1 回の呼び出しの上限秒数 |
| `MAX_OUTPUT_TOKENS` | 1024 | 1 回の応答の最大出力トークン数 |
| `LLM_MAX_RETRIES` | 2 | 一時的なエラー (5xx / 通信エラー) のリトライ回数 |
| `AGENT_MAX_ITERATIONS` | 4 | エージェントループの最大反復回数 |
| `AGENT_BUDGET_SECONDS` | 40 | 1 リクエスト全体の時間予算（`vercel.json` の `maxDuration`=60 より短く） |
| `MAX_INPUT_CHARS` | 500 | 質問の最大文字数 |
| `MAX_HISTORY` | 10 | サーバーに送る会話履歴の件数 |
| `RATE_LIMIT_PER_IP_PER_MINUTE` | 5 | IP ごとの 1 分あたりの上限（0 で無効） |
| `RATE_LIMIT_PER_IP_PER_DAY` | 40 | IP ごとの 1 日あたりの上限 |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | 10 | インスタンス全体の 1 分あたりの上限 |

## API

### `POST /api/chat`

```json
{ "lang": "ja", "messages": [{ "role": "user", "text": "制作物を教えて" }] }
```

レスポンスは `text/event-stream`。エージェントの進行を次のイベントで返します。

| event | data | 意味 |
|---|---|---|
| `tool` | `{"name": "get_projects"}` | ツールを実行した |
| `delta` | `{"text": "..."}` | 回答テキストの断片 |
| `notice` | `{"code": "partial_timeout"}` | 時間切れのため途中までの回答であること |
| `done` | `{"tools": [...], "request_id": "..."}` | 回答完了 |
| `error` | `{"code": "rate_limited", "detail": "...", "request_id": "..."}` | ストリーム開始後のエラー |

入力エラー（422）・提供地域外（451）・レート制限（429）・設定エラー（500）は、ストリーム開始前に JSON `{"code": "...", "detail": "..."}` で返ります。
フロントは `code` から現在の表示言語のメッセージを選びます。

### `GET /api/blog`

TECH BLOG の最新3記事。Vercel の CDN に1時間キャッシュされます。

## エージェントの仕組み

ツールはすべて Python の関数で、JSON Schema で引数を宣言しています（`app/tools.py`）。

| ツール | 内容 |
|---|---|
| `get_skills(category?)` | スキル一覧（カテゴリで絞り込み可） |
| `get_projects(technology?)` | 制作物一覧（技術名で絞り込み可） |
| `get_experience()` | 基本情報と職歴 |
| `get_contact_info()` | 連絡先 |
| `get_site_info()` | このサイトとチャットの仕組み |
| `get_blog_posts(limit?)` | ブログの最新記事 |

ループ（`app/agent.py`）は次のとおりです。Gemini の自動実行（automatic function calling）は使っていません。

1. 会話履歴とツール定義を渡して Gemini を呼ぶ（ストリーミング）
2. 応答に `function_call` があれば、ツールを実行して `function_response` を履歴に追加し、1 に戻る
3. テキスト応答になったら終了

- 反復は最大 4 回。最後の反復はツールを禁止して必ずテキストで答えさせる
- 全体の時間予算は 40 秒。各呼び出しのタイムアウトは「15 秒」と「予算の残り」の小さい方
- 時間切れの時点で回答の一部を返せていれば、その部分と「時間切れのため一部のみ表示しています」を表示
- 5xx / 通信エラーは指数バックオフ（0.5 秒 → 1 秒）で最大 2 回リトライ。ただし予算が残っていて、かつテキストをまだ送っていない場合のみ（重複表示を防ぐため）
- 429（Gemini の無料枠超過）はリトライせず、「現在アクセスが集中しています」と表示

## ログの確認

ログは 1 行 1 JSON で標準出力に書き出し、Vercel の **Logs**（Runtime Logs）で確認できます。CLI では `vercel logs <デプロイURL>` でも見られます。
Hobby プランの Runtime Logs は**直近 1 時間分**のみ保持されます。

チャット 1 回ごとに `chat_completed` を出力します（**発言本文・回答本文は記録しません**）。

```json
{"ts": 1793105778.662, "level": "info", "event": "chat_completed", "request_id": "a5b1722863754694",
 "outcome": "ok", "duration_ms": 14779, "model": "gemini-3.5-flash-lite", "lang": "ja",
 "messages": 1, "input_chars": 7, "answer_chars": 96, "iterations": 2, "retries": 0,
 "tools": ["get_contact_info"], "usage": {"prompt_tokens": 1918, "output_tokens": 50, "total_tokens": 1968}, "error": null}
```

| event | 出力されるとき |
|---|---|
| `chat_completed` | チャット 1 回の終了時（`outcome`: `ok` / `partial_timeout` / `empty_reply` / エラーコード） |
| `chat_region_blocked` | 提供地域外のため拒否（国コードのみ記録） |
| `chat_rate_limited` | レート制限で拒否（IP は SHA-256 の先頭 12 桁に匿名化） |
| `chat_rejected` | 入力バリデーションで拒否 |
| `chat_failed` | ストリーム開始前の LLM エラー（設定エラーなど） |
| `blog_fetch_failed` | ブログの取得失敗 |

画面のエラー表示には `request_id`（エラーID）を出しているので、問い合わせがあった場合はログを `request_id` で検索して原因を特定できます。

## 設計判断

- **FastAPI**: 型ヒントから入力バリデーション（Pydantic）を宣言的に書け、`StreamingResponse` で SSE も素直に書ける。Vercel が FastAPI をゼロコンフィグで検出し、`public/` を CDN から配信してくれる点も決め手になった。
- **SSE（Server-Sent Events）**: サーバー → ブラウザの一方向のストリーミングで足りるため、WebSocket より単純な SSE を選んだ。ツールの実行状況（`tool`）と回答の断片（`delta`）を同じストリームで送れる。POST でリクエストを送る必要があるため、ブラウザ側は `EventSource` ではなく `fetch` のストリームを読んでいる。
  - **Vercel 上での検証結果**: Python の SSE は途中でまとめて送られる（バッファされる）おそれがあったため、ローカルだけで判断せず、プレビュー環境で各イベントの到着時刻を計測した。`tool` イベント 2.1 秒 → 最初の `delta` 5.0 秒 → `done` 5.3 秒と逐次届いており、**フォールバック（非ストリーミング + タイピング風表示など）は不要**と判断した（2026-10-27）。
- **ステートレス**: 会話履歴はブラウザが持ち、毎回直近 10 件を送る。サーバーレス環境ではリクエストごとに別のインスタンスが処理しうるため、サーバー側に状態を持たない方が単純で壊れにくい。
- **手動エージェントループ**: SDK の自動実行に任せず、関数呼び出し → 実行 → 結果返却を自分で書いた。反復回数・時間予算・リトライ・ツール実行の通知（バッジ表示）を細かく制御でき、仕組みがコードから読める。
- **LLM 呼び出しを 1 モジュールに分離**: `llm.py` にプロバイダ非依存の型（`ToolSpec` / `ModelTurn` / `TextDelta` など）と `LLMClient` プロトコルを定義し、Gemini 固有のコードはその中だけに置いた。プロバイダを差し替えやすく、テストではモック（`tests/conftest.py` の `ScriptedLLM`）に置き換えて実 API なしでループを検証できる。なお Gemini 3 系は関数呼び出しに付く thought signature を次のリクエストで返す必要があるため、モデル応答は Gemini の形のまま `ModelTurn.raw` に保持している。
- **経歴データはツール経由で取得**: プロンプトに `profile.json` を丸ごと埋め込まず、必要な部分だけをツールで取らせる。回答の根拠がツール結果に限定され、ログの `tools` で「何を根拠に答えたか」を追える。
- **uv**: 依存の定義（`pyproject.toml`）とロックファイル（`uv.lock`）を一本化でき、`uv sync --locked` で CI とローカルの環境をそろえられる。Vercel も `uv.lock` からのインストールに対応しているため、`requirements.txt` を二重管理する必要がない。
- **提供地域の制御**: Gemini API 追加利用規約では、EEA・スイス・英国のユーザーに提供する場合は有料サービスのみ利用可能とされている。無料枠のまま公開を続けるため、Vercel が付与する `x-vercel-ip-country` ヘッダーで国を判定し、これらの地域からの `/api/chat` には 451（Unavailable For Legal Reasons）を返す。ページの他の部分はそのまま表示する。判定はレート制限より前に行い、拒否したリクエストがレート制限の枠を消費しないようにしている。
- **ビルド不要のフロントエンド**: ページ規模に対してフレームワークは過剰と判断し、HTML / CSS / バニラ JS にした。AI の出力は常に `textContent` で描画し、XSS を防いでいる。

## 既知の制限

- **Gemini API 無料枠**
  - モデルごとに 1 分あたり / 1 日あたりのリクエスト数・トークン数の上限がある（プロジェクト単位。具体的な値は AI Studio で確認）。1 回の質問でエージェントが最大 4 回 Gemini を呼ぶため、上限に達すると「現在アクセスが集中しています」と表示される
  - 無料枠の入力・出力は Google の製品改善に使われ、人が確認する場合がある。そのためチャット画面に「個人情報は入力しないでください」と表示している
  - 規約上、EEA・スイス・英国のユーザーに提供する場合は有料サービスのみ利用可能とされているため、これらの地域では AI チャットを提供していない（IP アドレスによる国の判定のため、VPN などでは判定が実際の所在地と異なる場合がある）
  - モデルの提供状況は変わる。開発中、`gemini-3.8-flash` は高負荷で 503 / 504 が続き、`gemini-2.5-flash-lite` は新規ユーザーには提供終了となっていた。モデルは `GEMINI_MODEL` で切り替えられる
- **Vercel Hobby プラン**
  - 個人・非商用の利用に限られる（本サイトは就職活動用の個人ポートフォリオで、広告・課金の要素はない）
  - 関数の最大実行時間は 300 秒。本サイトは `maxDuration` を 60 秒、エージェントの予算を 40 秒にしている
  - 関数の実行回数・CPU 時間・転送量に月間の上限があり、超えると最大 30 日間停止する。面接官が少人数で触る程度なら十分収まる想定
  - しばらくアクセスがないとコールドスタートで初回の応答が遅くなる（画面に「初回は少し時間がかかります」と表示）
  - Runtime Logs は直近 1 時間分のみ
- **メモリ内レート制限の限界**: 制限の記録は各インスタンスのメモリにあり、インスタンスをまたいで共有されない。インスタンスが増えたり再起動したりすると、実際の上限は設定値より緩くなる。Gemini 無料枠を使い切らないための簡易的な安全柵という位置づけ
- **ブログの取得**: ブログに RSS / API がないため HTML をパースしている。ブログ側のマークアップが変わると取得できなくなる（その場合はブログへのリンクのみ表示）。CDN キャッシュのため、新しい記事の反映に最大 1 時間かかる

## 今後の改善案

- レート制限をインスタンス間で共有する（外部の KV ストアの利用。無料枠で収まるか要確認）
- 回答品質の評価（想定質問と期待する根拠ツールのセットを用意し、プロンプト変更時に自動で比較する）
- ブラウザでの E2E テスト（Playwright で SSE 表示・言語切り替え・エラー表示を確認）
- サニタイズ済みの Markdown 描画（現在はプレーンテキスト表示で、プロンプトで Markdown を使わないよう指示している）
- ブログ記事の本文を取り込んだ検索（RAG）で、記事の内容についても答えられるようにする

## 利用範囲について

本サイトは就職活動用の**個人・非商用のポートフォリオ**です。広告・課金・商用サービスの要素はなく、Vercel Hobby プランと Gemini API 無料枠の範囲で運用しています。
どちらにも使用量の上限があるため、上限に達した場合は一時的にチャットが使えなくなることがあります。

## 参照した公式ドキュメント（確認日: 2026-10-27）

無料プランの仕様は変更されることがあるため、確認した時点の情報として記載します。

- Vercel Python Runtime（対応バージョン 3.12 / 3.13 / 3.14、`pyproject.toml` / `uv.lock` に対応、ストリーミング対応）: https://vercel.com/docs/functions/runtimes/python
- Vercel で FastAPI をデプロイ（エントリポイント、`public/` の CDN 配信、`maxDuration` の設定）: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Functions の制限（Hobby の最大実行時間 300 秒）: https://vercel.com/docs/functions/limitations
- Vercel のリクエストヘッダー（`x-vercel-ip-country`、`x-forwarded-for` は Vercel が上書き）: https://vercel.com/docs/headers/request-headers
- Vercel Hobby プラン（月間の使用量、超過時の停止、非商用・個人利用のみ、Runtime Logs 1 時間）: https://vercel.com/docs/plans/hobby
- Gemini API の料金（無料枠の対象モデル、無料枠の入力は製品改善に使われる）: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API のレート制限（モデルごと・プロジェクト単位、値は AI Studio で確認）: https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API 追加利用規約（無料枠のデータ利用、提供地域）: https://ai.google.dev/gemini-api/terms
- astral-sh/setup-uv（GitHub Actions）: https://github.com/astral-sh/setup-uv
