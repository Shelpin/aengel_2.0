#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== ElizaOS Multi-Agent Telegram System - Enhanced Runtime =====${NC}"
echo -e "${YELLOW}Starting agents with memory optimization and polling fixes...${NC}"

# Debug function to print paths and check files
debug_environment() {
  echo -e "${YELLOW}[DEBUG] Environment check:${NC}"
  echo -e "Current directory: $(pwd)"
  echo -e "PATH: $PATH"
  echo -e "NODE_PATH: $NODE_PATH"
  echo -e "Node version: $(node -v)"
  echo -e "NPM version: $(npm -v)"
  
  # Check for essential files
  echo -e "\n${YELLOW}[DEBUG] Checking essential files:${NC}"
  if [ -f "./patches/start-agent-with-patches.js" ]; then
    echo -e "✓ Found start-agent-with-patches.js"
  else
    echo -e "${RED}✗ Missing start-agent-with-patches.js${NC}"
  fi
  
  # Check character files
  echo -e "\n${YELLOW}[DEBUG] Checking character files:${NC}"
  for agent in "eth_memelord_9000" "bag_flipper_9000" "linda_evangelista_88"; do
    if [ -f "./characters/${agent}.json" ]; then
      echo -e "✓ Found ${agent}.json"
    else
      echo -e "${RED}✗ Missing ${agent}.json${NC}"
    fi
  done
  
  # Check for required modules
  echo -e "\n${YELLOW}[DEBUG] Checking required modules:${NC}"
  if [ -d "./node_modules/@elizaos-plugins/client-telegram" ]; then
    echo -e "✓ Found client-telegram module"
  else
    echo -e "${RED}✗ Missing client-telegram module${NC}"
  fi
  
  if [ -d "./node_modules/@elizaos/telegram-multiagent" ]; then
    echo -e "✓ Found telegram-multiagent module"
  else
    echo -e "${RED}✗ Missing telegram-multiagent module${NC}"
  fi
}

# Cleanup ports and processes first
echo -e "${YELLOW}[1/4] Performing thorough cleanup...${NC}"
./stop_agents.sh

# More aggressive cleanup
echo -e "Killing any existing Node.js processes..."
pkill -f "node.*eliza" || true
pkill -f "start-agent-with-patches.js" || true
sleep 2

# Force kill any remaining processes
echo -e "Force killing any stuck processes..."
pkill -9 -f "node.*eliza" || true
pkill -9 -f "start-agent-with-patches.js" || true
sleep 1

# Check and clean ports
echo -e "Cleaning up ports..."
for port in {3000..3010}; do
  pid=$(lsof -ti :$port)
  if [ ! -z "$pid" ]; then
    echo "Killing process $pid using port $port"
    kill -9 $pid || true
  fi
done

# Clean all PID files
rm -f /root/eliza/ports/*.pid
rm -f ./logs/*.pid

# Create required directories
mkdir -p logs
mkdir -p ports

echo -e "${GREEN}✓ Cleanup complete${NC}"

# Debug environment and file checks
echo -e "${YELLOW}[2/4] Performing environment checks...${NC}"
debug_environment

# Set environment variables with more aggressive memory management
echo -e "${YELLOW}[3/4] Setting up memory management...${NC}"

# More aggressive memory settings - removing optimize_for_size flag
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc --max_semi_space_size=64"
export FORCE_GC="1"
export DISABLE_POLLING="true"
export GC_INTERVAL="30000" # Force GC every 30 seconds

echo -e "${GREEN}✓ Memory management configured with strict limits${NC}"

# Define agents and ports - start with just one agent for testing
agents=("eth_memelord_9000")
PORT=3000

echo -e "${YELLOW}[4/4] Starting agents with enhanced runtime...${NC}"

# Start only one agent initially for debugging
for agent in "${agents[@]}"; do
  echo -e "${BLUE}🤖 Starting $agent on port $PORT with enhanced patches${NC}"
  
  # Double-check the port is free
  if lsof -i :$PORT > /dev/null 2>&1; then
    echo "❌ Port $PORT is in use. Killing processes and retrying..."
    lsof -ti :$PORT | xargs -r kill -9
    sleep 2
  fi
  
  # Set environment variables for this agent
  export AGENT_ID="${agent}"
  export PORT="${PORT}"
  export TELEGRAM_BOT_USERNAME="${agent}_bot"

  # Create a custom GC script for this agent
  cat > ./gc_${agent}.js << EOF
// Force garbage collection periodically
const gcInterval = ${GC_INTERVAL};
console.log('[GC] Starting periodic garbage collection every ${GC_INTERVAL}ms');

setInterval(() => {
  try {
    if (global.gc) {
      console.log('[GC] Running forced garbage collection');
      global.gc();
    }
  } catch (e) {
    console.error('[GC] Error during garbage collection:', e);
  }
}, gcInterval);
EOF

  # Create a log directory for this specific run
  LOG_DIR="./logs/debug_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$LOG_DIR"
  
  # Start the agent with patches and our custom GC script - added debug output
  echo "Starting agent with command:"
  echo "node --expose-gc --max-old-space-size=512 --max-semi-space-size=64 --experimental-specifier-resolution=node --require=./gc_${agent}.js ./patches/start-agent-with-patches.js --character=\"characters/${agent}.json\" --clients=@elizaos-plugins/client-telegram --plugins=@elizaos/telegram-multiagent --log-level=debug --port=$PORT"
  
  node --expose-gc --max-old-space-size=512 --max-semi-space-size=64 \
       --experimental-specifier-resolution=node \
       --require=./gc_${agent}.js \
       ./patches/start-agent-with-patches.js \
       --character="characters/${agent}.json" \
       --clients=@elizaos-plugins/client-telegram \
       --plugins=@elizaos/telegram-multiagent \
       --log-level=debug \
       --port=$PORT > "$LOG_DIR/${agent}.log" 2>&1 &
  
  # Record the PID
  AGENT_PID=$!
  echo $AGENT_PID > ./ports/${agent}.pid
  echo $AGENT_PID > ./logs/${agent}.pid
  
  echo -e "${GREEN}✓ Agent $agent started with PID $AGENT_PID${NC}"
  echo -e "${YELLOW}Checking if agent process is still running after 5 seconds...${NC}"
  sleep 5
  
  # Verify the process is still running
  if ps -p $AGENT_PID > /dev/null; then
    echo -e "${GREEN}✓ Agent $agent is running with PID $AGENT_PID${NC}"
    echo -e "${YELLOW}Initial log output:${NC}"
    head -n 20 "$LOG_DIR/${agent}.log"
  else
    echo -e "${RED}✗ Agent $agent failed to start or crashed - check logs in $LOG_DIR/${agent}.log${NC}"
    echo -e "${YELLOW}Error log:${NC}"
    cat "$LOG_DIR/${agent}.log"
  fi
  
  # Increment port for next agent
  PORT=$((PORT + 1))
  
  echo -e "${YELLOW}Waiting 5 seconds before proceeding...${NC}"
  sleep 5
done

echo -e "${GREEN}✅ Agent startup process completed${NC}"
echo -e "${BLUE}Monitor commands:${NC}"
echo -e "  - View logs: ${YELLOW}./monitor_agents.sh -w${NC}"
echo -e "  - Check memory: ${YELLOW}watch -n 1 'ps aux --sort -rss | grep node | head -n 10'${NC}"
echo -e "  - Check agent status: ${YELLOW}./monitor_agents.sh -s${NC}"
echo -e "  - Check debug logs: ${YELLOW}cat $LOG_DIR/*.log${NC}"
