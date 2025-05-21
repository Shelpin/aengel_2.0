#!/bin/bash

# ================================================================================
# IMPROVED ÆTERNALS VALHALLA LAUNCH SCRIPT
# This script handles full startup of the relay server and all agent processes
# With error handling, proper logging, and process management
# ================================================================================

set -e  # Exit on any error

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│      VALHALLA LAUNCH SCRIPT (v2.2)      │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"

# Create logs directory
LOGS_DIR="/root/eliza/logs"
mkdir -p "$LOGS_DIR"

# Clean up existing processes
echo -e "\n${YELLOW}[1] Stopping existing processes...${NC}"
pkill -f "node.*agent" || true
pkill -f "node.*server.js" || true
pkill -f "patches/start-agent" || true
sleep 3  # Allow processes to terminate

# ========== ENVIRONMENT SETUP ==========

echo -e "\n${YELLOW}[2] Setting up environment variables...${NC}"

# Core environment variables
export RELAY_SERVER_URL="http://localhost:4000"
export RELAY_AUTH_TOKEN="elizaos-secure-relay-key"
export TELEGRAM_GROUP_IDS="-1002550618173"

# Runtime optimization flags
export USE_IN_MEMORY_DB=true
export FORCE_GC=true
export DISABLE_POLLING=false
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"

echo -e "  ${GREEN}✓ Environment variables set${NC}"

# ========== CHARACTER FILE PLACEMENT ==========

echo -e "\n${YELLOW}[3] Setting up character files...${NC}"

CHARACTER_DIR="/root/eliza/packages/agent/src/characters"
mkdir -p "$CHARACTER_DIR"

# Verify source characters exist
if [ ! -d "/root/eliza/characters" ]; then
  echo -e "  ${RED}✗ Error: Character source directory not found!${NC}"
  exit 1
fi

# Copy character files
echo -e "  ${BLUE}Copying character files...${NC}"
cp /root/eliza/characters/*.json "$CHARACTER_DIR"

# Verify files were copied
if [ ! "$(ls -A $CHARACTER_DIR)" ]; then
  echo -e "  ${RED}✗ Error: Failed to copy character files!${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓ Character files prepared${NC}"
ls -la "$CHARACTER_DIR"

# ========== DATABASE CLEANUP ==========

echo -e "\n${YELLOW}[4] Cleaning database files...${NC}"
rm -f ./data/db.sqlite ./data/db.sqlite-shm ./data/db.sqlite-wal
echo -e "  ${GREEN}✓ Database files cleaned${NC}"

# ========== AGGRESSIVE PORT CLEANUP ==========

echo -e "\n${YELLOW}[5] Ensuring ports are available (aggressive cleanup)...${NC}"

# Kill any processes using our target ports
for port in {3000..3007}; do
  if netstat -tuln | grep -q ":$port "; then
    echo -e "  ${YELLOW}Port $port is in use, forcefully killing process...${NC}"
    fuser -k $port/tcp || true
    sleep 2
    
    # Double-check port release
    if netstat -tuln | grep -q ":$port "; then
      echo -e "  ${RED}⚠ Port $port still in use after kill! Trying stronger measures...${NC}"
      # Find the PID more aggressively
      pid=$(lsof -i :$port -t)
      if [ ! -z "$pid" ]; then
        echo -e "  ${YELLOW}Found PID $pid on port $port, sending SIGKILL...${NC}"
        kill -9 $pid || true
        sleep 2
      fi
    fi
  fi
  
  # Final verification
  if netstat -tuln | grep -q ":$port "; then
    echo -e "  ${RED}✗ Failed to free port $port! This may cause issues.${NC}"
  else
    echo -e "  ${GREEN}✓ Port $port is available${NC}"
  fi
done

# ========== START RELAY SERVER ==========

echo -e "\n${YELLOW}[6] Starting Relay Server...${NC}"
cd /root/eliza/relay-server
PORT=4000 node server.js > "$LOGS_DIR/relay-server.log" 2>&1 &
RELAY_PID=$!
echo $RELAY_PID > "$LOGS_DIR/relay-server.pid"
cd /root/eliza
echo -e "  ${GREEN}✓ Relay server started with PID: ${RELAY_PID}${NC}"

# Wait for relay server to start
echo -e "  ${BLUE}Waiting for relay server to initialize...${NC}"
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
  if curl -s http://localhost:4000/health | grep -q "status.*ok"; then
    echo -e "  ${GREEN}✓ Relay server is up and running!${NC}"
    break
  fi
  
  if [ $attempt -eq $max_attempts ]; then
    echo -e "  ${RED}✗ Failed to start relay server after ${max_attempts} attempts${NC}"
    echo -e "  ${BLUE}Check logs at: $LOGS_DIR/relay-server.log${NC}"
    exit 1
  fi
  
  echo -e "  ${BLUE}Attempt ${attempt}/${max_attempts} - Waiting...${NC}"
  sleep 2
  ((attempt++))
done

# ========== AGENT CONFIGURATION ==========

echo -e "\n${YELLOW}[7] Configuring agents...${NC}"

# Define agents with their config (ID, port, token env var name)
declare -a AGENTS=(
  "eth_memelord_9000 3000 ETH_MEMELORD_BOT_TOKEN"
  "bag_flipper_9000 3001 BAG_FLIPPER_BOT_TOKEN"
  "code_samurai_77 3002 CODE_SAMURAI_BOT_TOKEN"
  "vc_shark_99 3003 VC_SHARK_BOT_TOKEN"
  "linda_evangelista_88 3004 LINDA_EVANGELISTA_BOT_TOKEN"
  "bitcoin_maxi_420 3005 BITCOIN_MAXI_BOT_TOKEN"
)

# ========== LAUNCH AGENTS SEQUENTIALLY WITH STRICT PORT BINDING ==========

echo -e "\n${YELLOW}[8] Launching agents with strict port binding...${NC}"

for agent in "${AGENTS[@]}"; do
  IFS=' ' read -r AGENT_ID PORT TOKEN_NAME <<< "$agent"
  
  echo -e "  ${BLUE}Launching ${AGENT_ID} on port ${PORT}...${NC}"
  
  # Verify character file exists
  CHARACTER_FILE="$CHARACTER_DIR/${AGENT_ID}.json"
  if [ ! -f "$CHARACTER_FILE" ]; then
    echo -e "  ${RED}✗ Error: Character file not found: ${CHARACTER_FILE}${NC}"
    echo -e "  ${YELLOW}Skipping agent: ${AGENT_ID}${NC}"
    continue
  fi
  
  # Double-check port is available
  if netstat -tuln | grep -q ":$PORT "; then
    echo -e "  ${RED}✗ Port $PORT is still in use! Killing again...${NC}"
    fuser -k $PORT/tcp || true
    sleep 3
  fi
  
  # Export the current agent token from environment
  export AGENT_ID="$AGENT_ID"
  export TELEGRAM_BOT_TOKEN="${!TOKEN_NAME}"
  
  # Hard-code port binding to prevent fallback
  # Use both methods to ensure the port is strictly enforced
  export BIND_PORT=$PORT
  export FORCE_EXACT_PORT=true
  export PORT=$PORT
  export SERVER_PORT=$PORT
  export NO_PORT_FALLBACK=true
  
  # Launch agent with proper environment
  # Redirect output to agent-specific log file
  AGENT_LOG="$LOGS_DIR/${AGENT_ID}.log"
  
  cd /root/eliza && \
  node patches/start-agent-with-patches.js --isRoot \
    --characters="$CHARACTER_FILE" \
    --clients=@elizaos/client-telegram \
    --plugins=@elizaos/telegram-multiagent \
    --port=$PORT \
    --log-level=debug > "$AGENT_LOG" 2>&1 &
  
  AGENT_PID=$!
  echo $AGENT_PID > "$LOGS_DIR/${AGENT_ID}.pid"
  echo -e "  ${GREEN}✓ ${AGENT_ID} started with PID: ${AGENT_PID}${NC}"
  
  # Wait to ensure the agent has time to bind to its port
  sleep 8
  
  # Verify the port is actually bound by this agent
  if ! netstat -tuln | grep -q ":$PORT "; then
    echo -e "  ${RED}✗ WARNING: Port $PORT is not bound after starting ${AGENT_ID}!${NC}"
  else
    # Verify it's bound by the correct PID
    BOUND_PID=$(lsof -i :$PORT -t || echo "unknown")
    if [[ "$BOUND_PID" == "$AGENT_PID" ]] || [[ "$BOUND_PID" == *"$AGENT_PID"* ]]; then
      echo -e "  ${GREEN}✓ Port $PORT is correctly bound by ${AGENT_ID} (PID: $AGENT_PID)${NC}"
    else
      echo -e "  ${YELLOW}⚠ Port $PORT is bound, but possibly by another process (PID: $BOUND_PID vs Agent PID: $AGENT_PID)${NC}"
    fi
  fi
  
  # Verify agent is responding (health check)
  max_health_attempts=10
  health_attempt=1
  while [ $health_attempt -le $max_health_attempts ]; do
    if curl -s http://localhost:${PORT}/health | grep -q "status.*ok"; then
      echo -e "  ${GREEN}✓ ${AGENT_ID} health check passed on port ${PORT}!${NC}"
      break
    fi
    
    if [ $health_attempt -eq $max_health_attempts ]; then
      echo -e "  ${YELLOW}⚠ Warning: ${AGENT_ID} health check failed after ${max_health_attempts} attempts${NC}"
      echo -e "  ${BLUE}Check logs at: ${AGENT_LOG}${NC}"
      echo -e "  ${BLUE}Last 10 lines of log:${NC}"
      tail -10 "$AGENT_LOG"
      
      # Check if the agent bound to an alternate port
      ALT_PORT=$(cat "$AGENT_LOG" | grep "Server started on alternate port" | tail -1 | grep -oE "[0-9]+" || echo "")
      if [ ! -z "$ALT_PORT" ]; then
        echo -e "  ${YELLOW}⚠ Agent appears to be running on alternate port: ${ALT_PORT}${NC}"
        # Try health check on the alternate port
        if curl -s http://localhost:${ALT_PORT}/health | grep -q "status.*ok"; then
          echo -e "  ${GREEN}✓ ${AGENT_ID} health check passed on ALTERNATE port ${ALT_PORT}!${NC}"
        else
          echo -e "  ${RED}✗ Health check also failed on alternate port ${ALT_PORT}${NC}"
        fi
      fi
    fi
    
    echo -e "  ${BLUE}Health check attempt ${health_attempt}/${max_health_attempts} - Waiting...${NC}"
    sleep 5
    ((health_attempt++))
  done
done

# ========== VERIFY AGENT REGISTRATION ==========

echo -e "\n${YELLOW}[9] Verifying agent registration with relay...${NC}"
sleep 10  # Allow time for all agents to register

# Get relay health status
RELAY_HEALTH=$(curl -s http://localhost:4000/health)
AGENTS_COUNT=$(echo "$RELAY_HEALTH" | grep -o '"agents":[0-9]*' | cut -d':' -f2)
AGENTS_LIST=$(echo "$RELAY_HEALTH" | grep -o '"agents_list":\[[^]]*\]' | cut -d':' -f2 | tr -d '[]"' | tr ',' '\n')

echo -e "  ${BLUE}Agents registered: ${AGENTS_COUNT}${NC}"
echo -e "  ${BLUE}Agents list:${NC}"

# Print each agent from the list
echo "$AGENTS_LIST" | while read -r agent_id; do
  echo -e "    - ${GREEN}${agent_id}${NC}"
done

if [ "$AGENTS_COUNT" -lt "${#AGENTS[@]}" ]; then
  echo -e "  ${YELLOW}⚠ Warning: Not all agents registered with relay${NC}"
  echo -e "  ${YELLOW}Expected ${#AGENTS[@]} agents, found ${AGENTS_COUNT}${NC}"
else
  echo -e "  ${GREEN}✓ All agents successfully registered!${NC}"
fi

# ========== HEALTH CHECK ALL AGENTS ==========

echo -e "\n${YELLOW}[10] Final health check for all agents...${NC}"

# Initialize agent port map
declare -A AGENT_PORTS

# Check for alternate ports in logs
for agent in "${AGENTS[@]}"; do
  IFS=' ' read -r AGENT_ID PORT TOKEN_NAME <<< "$agent"
  AGENT_LOG="$LOGS_DIR/${AGENT_ID}.log"
  
  # Check if agent bound to an alternate port
  ALT_PORT=$(cat "$AGENT_LOG" 2>/dev/null | grep "Server started on alternate port" | tail -1 | grep -oE "[0-9]+" || echo "")
  
  if [ ! -z "$ALT_PORT" ]; then
    AGENT_PORTS[$AGENT_ID]=$ALT_PORT
    echo -e "  ${YELLOW}⚠ ${AGENT_ID} is using alternate port: ${ALT_PORT} (expected: ${PORT})${NC}"
  else
    AGENT_PORTS[$AGENT_ID]=$PORT
  fi
}

# Check health on actual ports
for agent in "${AGENTS[@]}"; do
  IFS=' ' read -r AGENT_ID PORT TOKEN_NAME <<< "$agent"
  ACTUAL_PORT=${AGENT_PORTS[$AGENT_ID]:-$PORT}
  
  HEALTH_RESPONSE=$(curl -s http://localhost:${ACTUAL_PORT}/health 2>/dev/null)
  
  if echo "$HEALTH_RESPONSE" | grep -q "status.*ok"; then
    echo -e "  ${GREEN}✓ ${AGENT_ID} is healthy on port ${ACTUAL_PORT}${NC}"
  else
    echo -e "  ${RED}✗ ${AGENT_ID} is NOT responding on port ${ACTUAL_PORT}${NC}"
    echo -e "  ${BLUE}Check logs at: $LOGS_DIR/${AGENT_ID}.log${NC}"
  fi
done

# ========== FINAL INSTRUCTIONS ==========

echo -e "\n${GREEN}✅ VALHALLA SYSTEM LAUNCHED SUCCESSFULLY!${NC}"
echo -e "${BLUE}Actual port assignments:${NC}"

for agent in "${AGENTS[@]}"; do
  IFS=' ' read -r AGENT_ID PORT TOKEN_NAME <<< "$agent"
  ACTUAL_PORT=${AGENT_PORTS[$AGENT_ID]:-$PORT}
  echo -e "  ${YELLOW}${AGENT_ID}${NC}: ${ACTUAL_PORT} (expected: ${PORT})"
done

echo -e "\n${BLUE}System monitoring commands:${NC}"
echo -e "  ${YELLOW}tail -f $LOGS_DIR/*.log${NC}              - View all logs"
echo -e "  ${YELLOW}tail -f $LOGS_DIR/relay-server.log${NC}   - View relay logs"
echo -e "  ${YELLOW}tail -f $LOGS_DIR/eth_memelord_9000.log${NC} - View specific agent logs"
echo -e "  ${YELLOW}cat $LOGS_DIR/*.pid${NC}                  - List all process IDs"
echo -e "  ${YELLOW}curl http://localhost:4000/health${NC}    - Check relay status"

echo -e "\n${BLUE}To shut down the system:${NC}"
echo -e "  ${YELLOW}pkill -f 'node.*agent'${NC}               - Stop all agents"
echo -e "  ${YELLOW}pkill -f 'node.*server.js'${NC}           - Stop relay server"

echo
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    VALHALLA IS OPERATIONAL ⚔️  🛡️         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 