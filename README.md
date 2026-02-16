# 🪼 Jellyfish

Autonomous AI workforce platform with distributed intelligence.

## 🚀 Quick Start

### Requirements
- Node.js 20+
- pnpm
- Docker Desktop (for Redis)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Faunny/starfish.git
cd starfish
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY, etc.
```

### Run the system

1. Start Redis with Docker Compose:
```bash
docker-compose up -d
```

2. Start the agents:
```bash
chmod +x start.sh
./start.sh
```

3. To stop the agents:
```bash
./stop.sh
```

4. To stop Redis:
```bash
docker-compose down
```

### Architecture

- **Redis**: event bus (Pub/Sub) for communication between agents.
- **Memory**: stores history in SQLite and publishes `context.loaded`.
- **Core**: receives context, generates response with OpenRouter/Claude and publishes `action.completed`.
- **Chat**: receives Telegram messages, publishes `message.received` and sends responses to the user.
