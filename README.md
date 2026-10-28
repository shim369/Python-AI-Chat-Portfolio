# Python-AI-Chat-Portfolio

**English** | [日本語](README.ja.md)

[![Python-AI-Chat-Portfolio](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml/badge.svg)](https://github.com/shim369/Python-AI-Chat-Portfolio/actions/workflows/python-ai-chat-portfolio.yml)

A one-page portfolio that combines a self-introduction with an AI chat you can ask about my background.
The backend is Python (FastAPI). A **hand-written agent loop** built on Gemini API function calling answers by calling tools (career data, blog posts) and streams its progress to the page over SSE.

- Live site: https://python-ai-chat-portfolio.vercel.app
- Development process and tasks: [docs/BACKLOG.md](docs/BACKLOG.md) (3 sprints + extra tasks, in Japanese)

## Features

- A single self-introduction page (skills / projects / latest blog posts / how this site works / contact), responsive with dark mode
- An AI chat that opens from a button in the bottom-right corner (full screen on phones)
- Contact form: verified with reCAPTCHA v3, then sent to my own inbox over Gmail SMTP
- Japanese / English switching (UI text, the language of AI answers, and error messages)
- AI chat
  - Manual agent loop using Gemini function calling (with a maximum number of iterations and a time budget)
  - Shows each tool call as a badge (e.g. 🔧 Ran get_projects) and streams the answer over SSE
  - Answers "I don't know" for anything not in the career data (`profile.json`) instead of making up a career
- Operations: JSON structured logs, per-IP rate limiting, input length limits, retries on transient errors, region restrictions, pytest + GitHub Actions

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML / CSS / vanilla JavaScript (no build step, `public/`), GSAP + ScrollTrigger (CDN) |
| Backend | Python 3.14 / FastAPI (`app/`) |
| LLM | Google Gemini API (`google-genai` SDK, default model `gemini-3.5-flash-lite`) |
| Hosting | Vercel Hobby (free plan). `public/` is served from the CDN, `app/main.py` runs as a Python Function |
| Package management | uv (`pyproject.toml` + `uv.lock`) |
| Tests / CI | pytest / GitHub Actions (`astral-sh/setup-uv`) |

```
Browser ──(GET static files)──▶ Vercel CDN (public/)
   │
   ├─(POST /api/chat, SSE)──▶ FastAPI (Vercel Python Function)
   │                             ├─ Region restriction / rate limiting / input validation
   │                             ├─ agent.py: agent loop ──▶ llm.py ──▶ Gemini API
   │                             │      └─ tools.py ──▶ profile.json / TECH BLOG
   │                             └─ Structured logs (stdout → Vercel Runtime Logs)
   └─(POST /api/contact)────▶ FastAPI ──▶ contact.py ──▶ reCAPTCHA verification (Google) ──▶ Gmail SMTP
```

## Directory structure

```
app/
  main.py            FastAPI entry point (/api/chat, /api/contact, /api/blog, /api/health), rate limiting, logging
  contact.py         Contact form: reCAPTCHA v3 verification and sending mail over SMTP
  agent.py           Manual agent loop (repeat: function call → run → return result; retries, time budget)
  tools.py           Agent tools (Python functions) and their JSON Schemas
  llm.py             Module that encapsulates LLM calls (provider-agnostic types + Gemini implementation)
  schemas.py         Request definitions and input validation
  config.py          Reads environment variables (all limits are tuned here)
  rate_limit.py      In-memory sliding-window rate limiter
  region.py          Region restriction for the AI chat (not offered in the EEA, Switzerland, or the UK)
  logging_utils.py   JSON structured logging
  blog.py            Fetches the latest posts from the TECH BLOG top page (parses HTML because there is no RSS)
  profile.py         Loads profile.json / system.md
  data/profile.json  Career data the AI bases its answers on (edit this to change the content)
  prompts/system.md  System prompt
public/              Static page (edit skills and projects in js/config.js, UI text in js/i18n.js)
scripts/dev_server.py  Local development server (also serves public/)
tests/               pytest (never calls real APIs or external sites)
docs/BACKLOG.md      Tasks per sprint
```

## Running locally

Prerequisite: [uv](https://docs.astral.sh/uv/) is installed (uv sets up Python 3.14 automatically).

```bash
uv sync                      # create .venv and install dependencies
cp .env.example .env         # put GEMINI_API_KEY in .env (.env is not tracked by git)
uv run --env-file .env python scripts/dev_server.py
# → http://127.0.0.1:8000
```

To run in the same environment as Vercel, use the [Vercel CLI](https://vercel.com/docs/cli) (it loads `.env` automatically).

```bash
vercel dev
```

Tests (no API key needed; they never call the Gemini API or external sites):

```bash
uv run pytest
```

> If you use pyenv, `.python-version` (3.14) applies in this directory. Run commands through `uv run`.

## Getting a Gemini API key

1. Sign in to [Google AI Studio](https://aistudio.google.com/apikey) with a Google account
2. Create a key with "Create API key" (available on the free tier; no credit card required)
3. Set it in `.env` locally and in Vercel's environment variables in production. **Never put it in code or commits**

## Deploying to Vercel (GitHub integration)

1. Sign up for [Vercel](https://vercel.com/) with your GitHub account (Hobby plan, no credit card required)
2. Import `shim369/Python-AI-Chat-Portfolio` from "Add New… → Project"
3. The Framework Preset is detected as FastAPI automatically (from `tool.vercel.entrypoint` in `pyproject.toml`)
4. Set the following under "Environment Variables", then deploy
   - `GEMINI_API_KEY` (required)
   - Everything else is optional (see "Environment variables" below)
5. From then on, pushes to `main` deploy to production, and other branches and pull requests deploy previews automatically

If you change environment variables later, you need to redeploy (Deployments → Redeploy).
Preview deployments are protected by Vercel Authentication. From the CLI, access them with `vercel curl <URL>`.

## Environment variables

Everything except `GEMINI_API_KEY` is optional; unset values fall back to the defaults in `app/config.py` (see `.env.example` for the full list).

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | (required) | Gemini API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model to use |
| `LLM_TIMEOUT_SECONDS` | 15 | Time limit in seconds for a single Gemini call |
| `MAX_OUTPUT_TOKENS` | 1024 | Maximum output tokens per response |
| `LLM_MAX_RETRIES` | 2 | Retries on transient errors (5xx / network errors) |
| `AGENT_MAX_ITERATIONS` | 4 | Maximum iterations of the agent loop |
| `AGENT_BUDGET_SECONDS` | 40 | Time budget for a whole request (keep it below `maxDuration`=60 in `vercel.json`) |
| `MAX_INPUT_CHARS` | 500 | Maximum length of a question |
| `MAX_HISTORY` | 10 | Number of history messages sent to the server |
| `RATE_LIMIT_PER_IP_PER_MINUTE` | 5 | Per-IP limit per minute (0 disables it) |
| `RATE_LIMIT_PER_IP_PER_DAY` | 40 | Per-IP limit per day |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | 10 | Instance-wide limit per minute |
| `CONTACT_TO_EMAIL` | (empty) | Where contact messages go. The form returns 503 until this and the SMTP settings below are all set |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / 465 | SMTP server for sending (465 uses SSL, anything else uses STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | (empty) | SMTP login. For Gmail, the sending account and an **app password** |
| `RECAPTCHA_SECRET_KEY` | (empty) | reCAPTCHA v3 secret key. Verification is skipped when empty (for local development; always set it in production) |
| `RECAPTCHA_MIN_SCORE` | 0.5 | Minimum reCAPTCHA score to accept |
| `CONTACT_RATE_LIMIT_PER_IP_PER_MINUTE` | 2 | Per-IP contact limit per minute |
| `CONTACT_RATE_LIMIT_PER_IP_PER_DAY` | 10 | Per-IP contact limit per day |
| `CONTACT_RATE_LIMIT_GLOBAL_PER_MINUTE` | 10 | Instance-wide contact limit per minute |

The reCAPTCHA **site key** (the public one) goes in `RECAPTCHA_SITE_KEY` in `public/js/config.js`.

### Setting up the contact form

1. Create a **reCAPTCHA v3** key in the [reCAPTCHA admin console](https://www.google.com/recaptcha/admin/create). Register your production domain and `localhost` (`127.0.0.1`)
2. Put the site key in `RECAPTCHA_SITE_KEY` in `public/js/config.js`, and the secret key in the `RECAPTCHA_SECRET_KEY` environment variable
3. Turn on 2-Step Verification for the sending Google account and create an [app password](https://myaccount.google.com/apppasswords)
4. Set `SMTP_USER` (the sending Gmail address), `SMTP_PASS` (the app password), and `CONTACT_TO_EMAIL` (the receiving address)

The mail's From is the sending Gmail account and its Reply-To is the sender's address, so you can answer with Gmail's "Reply" as usual.

## API

### `POST /api/chat`

```json
{ "lang": "en", "messages": [{ "role": "user", "text": "Tell me about your projects" }] }
```

The response is `text/event-stream`. The agent's progress is sent as the following events.

| event | data | Meaning |
|---|---|---|
| `tool` | `{"name": "get_projects"}` | A tool was run |
| `delta` | `{"text": "..."}` | A chunk of the answer text |
| `notice` | `{"code": "partial_timeout"}` | The answer is partial because time ran out |
| `done` | `{"tools": [...], "request_id": "..."}` | The answer is complete |
| `error` | `{"code": "rate_limited", "detail": "...", "request_id": "..."}` | An error after the stream started |

Input errors (422), unsupported regions (451), rate limits (429), and configuration errors (500) are returned before the stream starts, as JSON `{"code": "...", "detail": "..."}`.
The frontend uses `code` to pick a message in the current display language.

### `POST /api/contact`

```json
{ "name": "Jane Doe", "email": "jane@example.com", "message": "...", "recaptcha_token": "...", "lang": "en" }
```

On success it returns `{"ok": true, "request_id": "..."}`. Failures return `{"code": "...", "detail": "..."}`:
input errors (422: `name_required` / `invalid_email` / `message_too_long`, etc.), a failed reCAPTCHA check (403: `recaptcha_failed`),
rate limits (429), not configured (503: `contact_unavailable`), and send failures (502: `contact_failed`).

### `GET /api/blog`

The 3 latest TECH BLOG posts. Cached on Vercel's CDN for 1 hour.

## How the agent works

Every tool is a Python function that declares its arguments with JSON Schema (`app/tools.py`).

| Tool | Description |
|---|---|
| `get_skills(category?)` | List of skills (can filter by category) |
| `get_projects(technology?)` | List of projects (can filter by technology) |
| `get_experience()` | Basic info and work history |
| `get_contact_info()` | Contact info |
| `get_site_info()` | How this site and the chat work |
| `get_blog_posts(limit?)` | Latest blog posts |

The loop (`app/agent.py`) works as follows. It does not use Gemini's automatic function calling.

1. Call Gemini with the conversation history and tool definitions (streaming)
2. If the response contains a `function_call`, run the tool, add a `function_response` to the history, and go back to 1
3. Stop when the response is text

- At most 4 iterations. Tools are disabled on the last iteration so it always answers with text
- The overall time budget is 40 seconds. Each call's timeout is the smaller of 15 seconds and the remaining budget
- If part of the answer was already sent when time runs out, it shows that part plus "Time ran out, so only part of the answer is shown."
- 5xx / network errors are retried up to 2 times with exponential backoff (0.5 s → 1 s), but only while budget remains and no text has been sent yet (to avoid showing text twice)
- 429 (Gemini free tier exceeded) is not retried; it shows "The service is busy right now."

## Checking logs

Logs are written as one JSON object per line and can be viewed in Vercel's **Logs** (Runtime Logs).
On the Hobby plan, Runtime Logs keep **only the last hour**.

- Logs with `level` `error` go to **stderr**, everything else to stdout. Vercel treats Python's stderr as `error` and stdout as `info`, so you can filter errors alone by Vercel's level
- `warning` (rate limits, region restrictions, input errors) goes to stdout. Python has no way to produce Vercel's `warning` level, and writing to stderr would make it `error`. These return 4xx, so Vercel still shows them as warnings per request
- Errors after SSE starts (Gemini timeouts, 429s, etc.) keep HTTP status 200, so this level split is what makes them findable

```bash
vercel logs --project python-ai-chat-portfolio --environment production --query 'level:error' --since 1h
```

Each chat writes a `chat_completed` entry (**the user's messages and the answers are not logged**).

```json
{"ts": 1793105778.662, "level": "info", "event": "chat_completed", "request_id": "a5b1722863754694",
 "outcome": "ok", "duration_ms": 14779, "model": "gemini-3.5-flash-lite", "lang": "ja",
 "messages": 1, "input_chars": 7, "answer_chars": 96, "iterations": 2, "retries": 0,
 "tools": ["get_contact_info"], "usage": {"prompt_tokens": 1918, "output_tokens": 50, "total_tokens": 1968}, "error": null}
```

| event | When it is written |
|---|---|
| `chat_completed` | At the end of each chat (`outcome`: `ok` / `partial_timeout` / `empty_reply` / an error code) |
| `chat_region_blocked` | Rejected because of the region (only the country code is logged) |
| `chat_rate_limited` | Rejected by the rate limit (IPs are anonymized to the first 12 hex digits of SHA-256) |
| `chat_rejected` | Rejected by input validation |
| `chat_failed` | LLM error before the stream started (configuration errors, etc.) |
| `blog_fetch_failed` | Failed to fetch the blog |
| `contact_sent` | Contact mail sent (name, email, and message are not logged; only lengths and the reCAPTCHA score) |
| `contact_failed` | Failed reCAPTCHA check (warning) or mail send failure (error) |
| `contact_rejected` / `contact_rate_limited` | Contact input error / rate limit |
| `contact_recaptcha_skipped` | Verification was skipped because `RECAPTCHA_SECRET_KEY` is not set |

Error messages on the page include the `request_id` (error ID), so when someone reports a problem you can search the logs by `request_id` to find the cause.

## Design decisions

- **FastAPI**: Input validation (Pydantic) can be declared from type hints, and SSE is straightforward with `StreamingResponse`. Vercel also detects FastAPI with zero configuration and serves `public/` from the CDN, which settled the choice.
- **SSE (Server-Sent Events)**: One-way streaming from server to browser is enough, so I chose SSE over the more complex WebSocket. Tool progress (`tool`) and answer chunks (`delta`) can go over the same stream. Because the request has to be a POST, the browser reads a `fetch` stream instead of using `EventSource`.
  - **Verified on Vercel**: There was a risk that Python SSE would be buffered and sent in one batch, so instead of judging from local runs I measured each event's arrival time on a preview deployment. The `tool` event arrived at 2.1 s → first `delta` at 5.0 s → `done` at 5.3 s, one by one, so I concluded that **no fallback (non-streaming + typewriter effect, etc.) is needed** (2026-10-27).
- **Stateless**: The browser keeps the conversation history and sends the last 10 messages each time. On serverless, each request may be handled by a different instance, so keeping no state on the server is simpler and harder to break.
- **Manual agent loop**: Instead of leaving it to the SDK's automatic execution, I wrote function call → run → return result myself. This gives fine control over iterations, the time budget, retries, and tool notifications (badges), and the mechanism can be read from the code.
- **LLM calls isolated in one module**: `llm.py` defines provider-agnostic types (`ToolSpec` / `ModelTurn` / `TextDelta`, etc.) and an `LLMClient` protocol, and keeps all Gemini-specific code inside it. Providers are easy to swap, and tests replace it with a mock (`ScriptedLLM` in `tests/conftest.py`) to verify the loop without the real API. Gemini 3 models require the thought signature attached to function calls to be sent back in the next request, so model responses are kept in Gemini's own shape in `ModelTurn.raw`.
- **Career data fetched through tools**: Instead of embedding all of `profile.json` in the prompt, the model fetches only what it needs through tools. Answers are grounded only in tool results, and the `tools` field in the logs shows what each answer was based on.
- **uv**: Dependency definitions (`pyproject.toml`) and the lock file (`uv.lock`) live in one tool, and `uv sync --locked` keeps CI and local environments identical. Vercel also installs from `uv.lock`, so there is no `requirements.txt` to maintain in parallel.
- **Region restriction**: The Gemini API Additional Terms of Service say that only paid services may be used when serving users in the EEA, Switzerland, or the UK. To keep running on the free tier, the country is determined from the `x-vercel-ip-country` header that Vercel adds, and `/api/chat` returns 451 (Unavailable For Legal Reasons) for those regions. The rest of the page still works. The check runs before rate limiting so that rejected requests don't use up the rate limit.
- **No-build frontend**: A framework would be overkill for a page this size, so it is plain HTML / CSS / vanilla JS. AI output is always rendered with `textContent` to prevent XSS.

## Known limitations

- **Gemini API free tier**
  - Each model has per-minute / per-day limits on requests and tokens (per project; check the actual values in AI Studio). One question can call Gemini up to 4 times, so when the limit is reached the chat shows "The service is busy right now."
  - Free-tier inputs and outputs are used to improve Google's products and may be reviewed by humans. That's why the chat says "Please do not enter personal information."
  - Under the terms, only paid services may be used for users in the EEA, Switzerland, or the UK, so the AI chat is not offered in those regions (the country is determined from the IP address, so it may not match the actual location when using a VPN, etc.)
  - Model availability changes. During development, `gemini-3.8-flash` kept returning 503 / 504 under heavy load, and `gemini-2.5-flash-lite` was no longer available to new users. The model can be switched with `GEMINI_MODEL`
- **Vercel Hobby plan**
  - Limited to personal, non-commercial use (this site is a personal portfolio for job hunting, with no ads or payments)
  - The maximum function duration is 300 seconds. This site sets `maxDuration` to 60 seconds and the agent budget to 40 seconds
  - There are monthly limits on function invocations, CPU time, and data transfer; going over pauses the project for up to 30 days. A handful of interviewers trying it should stay well within them
  - After a period without traffic, a cold start makes the first response slower (the page says "the first reply may take a moment")
  - Runtime Logs keep only the last hour
- **Limits of in-memory rate limiting**: Rate limit records live in each instance's memory and are not shared across instances. When instances are added or restarted, the effective limit is looser than configured. It is meant as a simple safety net to avoid using up the Gemini free tier
- **Fetching the blog**: The blog has no RSS / API, so the HTML is parsed. If the blog's markup changes, fetching will fail (in that case only a link to the blog is shown). Because of the CDN cache, new posts can take up to 1 hour to appear

## Ideas for improvement

- Share rate limits across instances (using an external KV store; need to check whether it fits in a free tier)
- Evaluate answer quality (prepare expected questions with the tools they should be grounded in, and compare automatically when the prompt changes)
- End-to-end browser tests (use Playwright to check SSE rendering, language switching, and error display)
- Sanitized Markdown rendering (currently plain text, and the prompt tells the model not to use Markdown)
- Search over blog post content (RAG) so the chat can also answer questions about what the posts say

## Scope of use

This site is a **personal, non-commercial portfolio** for job hunting. It has no ads, payments, or commercial services, and runs within the Vercel Hobby plan and the Gemini API free tier.
Both have usage limits, so the chat may be temporarily unavailable when a limit is reached.

## Official documentation referenced (checked on 2026-10-27)

Free plan terms can change, so these reflect what was confirmed at that time.

- Vercel Python Runtime (supported versions 3.12 / 3.13 / 3.14, `pyproject.toml` / `uv.lock` support, streaming support): https://vercel.com/docs/functions/runtimes/python
- Deploying FastAPI on Vercel (entry point, serving `public/` from the CDN, configuring `maxDuration`): https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Functions limits (Hobby maximum duration of 300 seconds): https://vercel.com/docs/functions/limitations
- Vercel request headers (`x-vercel-ip-country`; `x-forwarded-for` is overwritten by Vercel): https://vercel.com/docs/headers/request-headers
- Vercel Hobby plan (monthly usage, pausing when exceeded, personal non-commercial use only, 1 hour of Runtime Logs): https://vercel.com/docs/plans/hobby
- Gemini API pricing (models covered by the free tier; free-tier inputs are used for product improvement): https://ai.google.dev/gemini-api/docs/pricing
- Gemini API rate limits (per model and per project; check values in AI Studio): https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API Additional Terms of Service (free-tier data use, available regions): https://ai.google.dev/gemini-api/terms
- astral-sh/setup-uv (GitHub Actions): https://github.com/astral-sh/setup-uv
