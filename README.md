# 🪼 Jellyfish

**Autonomous AI workforce platform.** Event-driven multi-agent system: Memory, Core, Chat, Action, and a Next.js dashboard (Vision) for team management, live logs, and configuration.

- **GitHub:** https://github.com/IronValleyLabs/jellyfish

---

## Requirements

- **Node.js 18+** (18, 20, 22 supported; Memory uses `better-sqlite3` v12)
- **pnpm**
- **Redis** — local (`redis-server`) or [Redis Cloud](https://redis.com/try-free/) (free tier, no Docker needed)

---

## Quick Start (one command)

Clone the repo and run the installer. It checks prerequisites and asks only for API keys (no browser popups).

```bash
git clone https://github.com/IronValleyLabs/jellyfish.git
cd jellyfish
chmod +x install.sh
./install.sh
```

You will be asked for:

1. **Redis** — Choose Redis Cloud (paste connection URL from https://redis.com/try-free/) or local (you must run `redis-server` yourself).
2. **AI provider** — OpenRouter or OpenAI, then paste the API key (from https://openrouter.ai/keys or https://platform.openai.com/api-keys).
3. **Telegram** (optional) — Bot token from https://t.me/BotFather.

Then the script builds, starts Jellyfish, and opens the dashboard. If you see any error, check **Troubleshooting** below.

**Alternative (run installer without cloning first):**

```bash
curl -fsSL https://raw.githubusercontent.com/IronValleyLabs/jellyfish/main/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

(Use your branch instead of `main` if needed.)

---

## Manual setup

### 1. Clone and install

```bash
git clone https://github.com/IronValleyLabs/jellyfish.git
cd jellyfish
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`. Main variables:

| Variable | Description |
|----------|-------------|
| **Chat** (set at least one) | |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | WhatsApp via Twilio; webhook: `http(s)://your-host:3010/webhook/whatsapp` |
| `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` | Slack (Socket Mode) |
| `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` | Line; webhook: `http(s)://your-host:3010/webhook/line` |
| `GOOGLE_CHAT_PROJECT_ID` or `GOOGLE_CHAT_WEBHOOK_URL` | Google Chat; webhook: `http(s)://your-host:3010/webhook/google-chat` |
| `CHAT_WEBHOOK_BASE_URL` | Base URL for webhook signature validation (e.g. `https://your-domain.com`) |
| `CHAT_WEBHOOK_PORT` | Webhook server port (default `3010`) |
| **LLM** | |
| `LLM_PROVIDER` | `openrouter` or `openai` |
| `OPENROUTER_API_KEY` | From [OpenRouter](https://openrouter.ai/keys) |
| `OPENAI_API_KEY` | From [OpenAI](https://platform.openai.com/api-keys) |
| `AI_MODEL` | e.g. `anthropic/claude-3.5-sonnet` |
| **Redis** | |
| `REDIS_HOST` | Redis host (default `localhost`) |
| `REDIS_PORT` | Redis port (default `6379`) |
| `REDIS_PASSWORD` | Redis password (leave empty for local) |
| **Other** | |
| `DATABASE_URL` | SQLite path for Memory (default `./sqlite.db`) |

### 3. Redis

- **Option A — Redis Cloud:** Sign up at [redis.com/try-free](https://redis.com/try-free/), create a database, and set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` (or the full connection URL) in `.env`.
- **Option B — Local:** Run Redis (e.g. `redis-server` or `docker run -p 6379:6379 redis`) and keep `REDIS_HOST=localhost`.

### 4. Run the platform

```bash
chmod +x start.sh
./start.sh
```

This builds packages and starts:

- **Memory** — conversation history (SQLite), publishes `context.loaded`
- **Core** — intent detection + response generation (OpenRouter/OpenAI), publishes `action.completed`
- **Chat** — Telegram/WhatsApp/Slack/Line/Google Chat; publishes `message.received`, sends replies
- **Action** — bash commands and web search
- **Vision** — Next.js dashboard at **http://localhost:3000**

### 5. Stop

```bash
./stop.sh
```

---

## Dashboard (Vision)

- **Home** — Team overview (up to 20 Mini Jellys), status, links to Gallery and Settings
- **Chat** — Full history of incoming and outgoing messages from all platforms (Telegram, WhatsApp, etc.) with user id, platform, and which Mini Jelly replied
- **Gallery** — Predefined AI roles; add to team with optional job description
- **Mini Jelly** (`/mini/[id]`) — Edit job description, status (active/paused), remove from team
- **Live Logs** — Real-time event stream from Redis (SSE)
- **Settings** — API keys, model, Redis; prompt editors (Core, Memory, Action)

---

## APIs (Vision)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | Server-Sent Events stream (Redis) |
| GET | `/api/team` | List team members (Mini Jellys) |
| POST | `/api/team` | Add member (`templateId`, optional `jobDescription`) |
| PATCH | `/api/team?id=` | Update member |
| DELETE | `/api/team?id=` | Remove member |
| GET | `/api/status` | Process status |
| GET | `/api/metrics` | Token usage / metrics |
| GET/POST | `/api/settings` | Read/write settings (LLM, Redis, etc.) |

---

## Troubleshooting

**`Redis is not reachable` / `[ioredis] ECONNREFUSED`**

Redis must be running before you start Jellyfish. Either:

- **Redis Cloud (easiest):** Sign up at https://redis.com/try-free/, create a database, copy the connection URL. In the project folder, edit `.env` and set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` from that URL (or run `./install.sh` again and choose option 1 for Redis).
- **Local:** Install Redis (`brew install redis` on macOS) and run `redis-server` in a terminal, then run `./start.sh` again.

**`Node ... is too old`**

You need Node 18 or newer. Install Node 20: `nvm install 20 && nvm use 20`, or from https://nodejs.org.

**`pnpm: command not found`**

Run `npm install -g pnpm`, then run the installer or `pnpm install` again.

**Dashboard shows "Body is disturbed or locked" or blank / error**

Usually means the backend could not connect to Redis. Fix Redis (see above), then restart with `./stop.sh` and `./start.sh`, and refresh the browser.

**Installer fails on `pnpm install` (e.g. better-sqlite3)**

Ensure Node 18+ is active (`node -v`). If you still see a build error, open an issue on GitHub with your OS and Node version.

---

## Documentation

- **[docs/](docs/README.md)** — Per-package configuration (Memory, Core, Chat, Action, Vision): env vars, events, and commands.

---

## Project structure

```
├── docs/                 # Configuration and reference
├── packages/
│   ├── shared/           # EventBus, Redis, event types, metrics
│   ├── memory/           # SQLite + Drizzle, context.loaded
│   ├── core/             # OpenRouter/OpenAI, intent + response, action.completed
│   ├── chat/             # Telegram, WhatsApp, Slack, Line, Google Chat
│   ├── action/           # Bash executor, web search
│   └── vision/           # Next.js dashboard, team API
├── .nvmrc                 # Node 20 (for nvm use)
├── install.sh             # One-command interactive installer
├── start.sh
├── stop.sh
├── .env.example
└── README.md
```

---

## Node version

**Node 18 or newer** (18, 20, 22 are supported). The repo includes an **`.nvmrc`** with `20` if you use nvm: run `nvm use` in the project directory.
