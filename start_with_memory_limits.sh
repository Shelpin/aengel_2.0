#!/bin/bash

# Set Node.js memory limits - increased from 512MB to 768MB
export NODE_OPTIONS="--max-old-space-size=768"

echo "🚀 Starting agents with memory limits (NODE_OPTIONS=${NODE_OPTIONS})"

# First clean up any existing processes more aggressively
echo "🧹 Cleaning up ports and processes..."
./cleanup_ports.sh

# Additional aggressive cleanup of any Node.js processes for our agents
echo "🔥 Performing additional process cleanup..."
for agent in eth_memelord_9000 vc_shark_99 code_samurai_77 bitcoin_maxi_420 bag_flipper_9000 linda_evangelista_88; do
  echo "  Checking for processes related to $agent..."
  pids=$(ps aux | grep "$agent" | grep -v grep | awk '{print $2}')
  if [ -n "$pids" ]; then
    for pid in $pids; do
      echo "  🛑 Killing process $pid for $agent"
      kill -9 $pid 2>/dev/null || true
    done
  fi
done

# Verify ports are actually free before proceeding
echo "🔍 Verifying ports are free..."
for port in {3000..3010}; do
  if lsof -i :$port > /dev/null 2>&1; then
    echo "❌ Port $port is still in use. Cannot proceed."
    echo "   Please manually kill the process using: sudo lsof -i :$port"
    exit 1
  else
    echo "✅ Port $port is free"
  fi
done

# Build the project first
echo "🔨 Building project..."
pnpm build || { echo "❌ Build failed!"; exit 1; }
echo "✅ Build complete"

# Check if relay server is running
echo "🔍 Checking if relay server is running..."
if ! curl -s http://localhost:4000/health | grep -q "status.*ok"; then
  echo "⚠️ Relay server not detected. Starting relay server..."
  cd relay-server && ./start-relay.sh && cd ..
  sleep 5
  
  # Verify relay server started
  if ! curl -s http://localhost:4000/health | grep -q "status.*ok"; then
    echo "❌ Failed to start relay server. Please start it manually."
    exit 1
  fi
  echo "✅ Relay server started and verified"
else
  echo "✅ Relay server already running"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Define agents - corrected sequence to match expected port allocation 
agents=("eth_memelord_9000" "bag_flipper_9000" "linda_evangelista_88" "vc_shark_99" "bitcoin_maxi_420" "code_samurai_77")
PORT=3000

# Start each agent with 5 second delay
for agent in "${agents[@]}"; do
  echo "🤖 Starting $agent on port $PORT"
  
  # Double-check the port is free immediately before starting the agent
  if lsof -i :$PORT > /dev/null 2>&1; then
    echo "❌ Port $PORT is suddenly in use. Skipping $agent."
    continue
  fi
  
  # Add FORCE_GC=1 environment variable to encourage garbage collection
  FORCE_GC=1 pnpm start --character="characters/${agent}.json" \
             --clients=@elizaos-plugins/client-telegram \
             --plugins=@elizaos/telegram-multiagent \
             --log-level=debug \
             --port=$PORT &
  
  # Save PID to file for cleanup with better error checking
  agent_pid=$!
  if [ $agent_pid -gt 0 ]; then
    echo $agent_pid > ./logs/${agent}.pid
    echo "  ✅ Agent started with PID: $agent_pid"
  else 
    echo "  ❌ Failed to get PID for $agent"
  fi
  
  PORT=$((PORT + 1))
  echo "💤 Waiting 10 seconds before starting next agent..."
  sleep 10
done

echo "✅ All agents started with memory limits"
echo "💡 Monitor logs with: tail -f logs/*.log"
echo "💡 Monitor memory with: watch -n 1 'ps aux --sort -rss | grep node'" 