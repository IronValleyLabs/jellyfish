#!/bin/bash
cd "$(dirname "$0")"

# Node 18+ required
NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -lt 18 ]; then
  echo "⚠️  Node $NODE_MAJOR is too old. Jellyfish needs Node 18 or newer."
  echo "   Run: nvm use 20   (or install Node 20 and use it)"
  exit 1
fi

if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo "✅ .env loaded"
fi

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
if ! node -e "
  const net = require('net');
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const s = net.connect(port, host, () => { s.destroy(); process.exit(0); });
  s.on('error', () => process.exit(1));
  s.setTimeout(3000, () => { s.destroy(); process.exit(1); });
" 2>/dev/null; then
  echo "❌ Redis is not reachable at $REDIS_HOST:$REDIS_PORT"
  echo ""
  echo "  • Use Redis Cloud (free): https://redis.com/try-free/"
  echo "    Then set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in .env"
  echo "  • Or start local Redis: redis-server"
  echo ""
  exit 1
fi
echo "✅ Redis reachable at $REDIS_HOST:$REDIS_PORT"

echo "🪼 Starting Jellyfish..."
echo ""
echo "✅ Building packages..."
pnpm build
echo ""
echo "🚀 Starting agents..."
echo ""
pnpm --filter @jellyfish/memory dev &
MEMORY_PID=$!
sleep 2
pnpm --filter @jellyfish/core dev &
CORE_PID=$!
sleep 2
pnpm --filter @jellyfish/action dev &
ACTION_PID=$!
sleep 2
pnpm --filter @jellyfish/chat dev &
CHAT_PID=$!
sleep 2
pnpm --filter @jellyfish/vision dev &
VISION_PID=$!
sleep 5
mkdir -p data
echo "{\"memory\":$MEMORY_PID,\"core\":$CORE_PID,\"action\":$ACTION_PID,\"chat\":$CHAT_PID,\"vision\":$VISION_PID}" > data/main-processes.json
echo ""
echo "🪼 Respawn Mini Jellys (if any)..."
curl -s -X POST http://localhost:3000/api/team/respawn >/dev/null 2>&1 || true
echo ""
echo "✅ Jellyfish is running!"
echo "   - Memory Agent (PID: $MEMORY_PID)"
echo "   - Core Agent (PID: $CORE_PID)"
echo "   - Action Agent (PID: $ACTION_PID)"
echo "   - Chat Agent (PID: $CHAT_PID)"
echo "   - Dashboard Vision (PID: $VISION_PID)"
echo ""
echo "🌐 Dashboard: http://localhost:3000"
echo "📱 Telegram: talk to your bot"
echo "🛑 Press Ctrl+C to stop"
echo ""
wait
