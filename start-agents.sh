#!/bin/bash
# ElizaOS Multi-Agent System Startup Script

# Initialize environment
source /root/eliza/.env 2>/dev/null || true

# Clean up existing processes
echo "Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "pnpm --filter @elizaos/agent start" 2>/dev/null || true
pkill -f "node patches/start-agent-with-patches.js" 2>/dev/null || true
sleep 2

# Check for ports in use and kill processes
echo "Checking for ports in use..."
for port in $(seq 3000 3010) $(seq 4000 4010); do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "Killing process using port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# Set common environment variables
export USE_IN_MEMORY_DB=true
export RELAY_SERVER_URL="http://localhost:4000"

# Start relay server
echo "Starting relay server on port 4000..."
cd /root/eliza/relay-server && PORT=4000 node server.js > /root/eliza/logs/relay-server.log 2>&1 &
RELAY_PID=$!
echo "Relay server started with PID: $RELAY_PID"

# Wait for relay server to initialize
echo "Waiting for relay server to initialize..."
sleep 5

# Verify relay server is running
echo "Verifying relay server..."
RELAY_CHECK=$(curl -s http://localhost:4000/health)
if [ -z "$RELAY_CHECK" ]; then
  echo "ERROR: Relay server not responding. Exiting."
  exit 1
else
  echo "Relay server responded: $RELAY_CHECK"
fi

# Start agents one by one
echo "Starting agent: eth_memelord_9000"
cd /root/eliza && AGENT_ID=eth_memelord_9000 \
  USE_IN_MEMORY_DB=true \
  RELAY_SERVER_URL=http://localhost:4000 \
  node patches/start-agent-with-patches.js \
  --isRoot \
  --characters=/root/eliza/packages/agent/src/characters/eth_memelord_9000.json \
  --clients=@elizaos/client-telegram \
  --plugins=@elizaos/telegram-multiagent \
  --port=3000 \
  --log-level=debug > /root/eliza/logs/eth_patches.log 2>&1 &
ETH_PID=$!
echo "ETH MemeLord agent started with PID: $ETH_PID"

sleep 5

echo "Starting agent: bag_flipper_9000"
cd /root/eliza && AGENT_ID=bag_flipper_9000 \
  USE_IN_MEMORY_DB=true \
  RELAY_SERVER_URL=http://localhost:4000 \
  node patches/start-agent-with-patches.js \
  --isRoot \
  --characters=/root/eliza/packages/agent/src/characters/bag_flipper_9000.json \
  --clients=@elizaos/client-telegram \
  --plugins=@elizaos/telegram-multiagent \
  --port=3001 \
  --log-level=debug > /root/eliza/logs/bag_patches.log 2>&1 &
BAG_PID=$!
echo "Bag Flipper agent started with PID: $BAG_PID"

sleep 5

echo "Starting agent: code_samurai_77"
cd /root/eliza && AGENT_ID=code_samurai_77 \
  USE_IN_MEMORY_DB=true \
  RELAY_SERVER_URL=http://localhost:4000 \
  node patches/start-agent-with-patches.js \
  --isRoot \
  --characters=/root/eliza/packages/agent/src/characters/code_samurai_77.json \
  --clients=@elizaos/client-telegram \
  --plugins=@elizaos/telegram-multiagent \
  --port=3005 \
  --log-level=debug > /root/eliza/logs/code_patches.log 2>&1 &
CODE_PID=$!
echo "Code Samurai agent started with PID: $CODE_PID"

sleep 5

# Check relay server health after agents have started
echo "Checking relay server health..."
FINAL_CHECK=$(curl -s http://localhost:4000/health)
echo "Relay server status: $FINAL_CHECK"

# Display running processes
echo "All processes started. Currently running:"
ps -ef | grep -E 'node server.js|patches/start-agent-with-patches.js' | grep -v grep

echo "Startup complete. Check logs for details:"
echo "- Relay server: /root/eliza/logs/relay-server.log"
echo "- ETH MemeLord: /root/eliza/logs/eth_patches.log"
echo "- Bag Flipper: /root/eliza/logs/bag_patches.log"
echo "- Code Samurai: /root/eliza/logs/code_patches.log"
echo ""
echo "To check agent connection status: curl http://localhost:4000/health" 