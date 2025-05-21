#!/bin/bash

# VALHALLA CONTROLLED LAUNCH SCRIPT - WITH OOM FIXES
# This script launches the Valhalla multi-agent system with memory optimizations 
# Based on OOM_FIXES.md recommendations

# Load and export environment variables from .env
set -a && [ -f ".env" ] && source .env && set +a

# Enforce default TELEGRAM_GROUP_IDS if not set in .env
: "${TELEGRAM_GROUP_IDS:=-1002550618173}"
export TELEGRAM_GROUP_IDS

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│      VALHALLA LAUNCH SCRIPT (OOM FIX)   │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"

# OOM FIX: Set environment variables to prevent memory issues
export DISABLE_POLLING=false
export FORCE_GC=true
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"

echo -e "${YELLOW}[ENV] Setting environment variables:${NC}"
echo -e "  ${GREEN}DISABLE_POLLING=${DISABLE_POLLING}${NC}"
echo -e "  ${GREEN}FORCE_GC=${FORCE_GC}${NC}"
echo -e "  ${GREEN}NODE_OPTIONS=${NODE_OPTIONS}${NC}"

# Configuration
RELAY_SERVER_URL="http://localhost:4000"
RELAY_AUTH_TOKEN="elizaos-secure-relay-key"
LOG_DIR="./logs"

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Clean up existing processes
echo -e "\n${YELLOW}[1] Stopping existing processes...${NC}"
if [ -f "./stop_agents.sh" ]; then
    echo -e "   ${BLUE}Stopping all agent processes...${NC}"
    ./stop_agents.sh all
else
    echo -e "   ${RED}Warning: stop_agents.sh not found, manually killing processes...${NC}"
    pkill -f "node.*agent" || true
fi

# Kill any old relay server
echo -e "   ${BLUE}Stopping relay server...${NC}"
pkill -f "node.*server.js" || true

# Wait for processes to fully stop
echo -e "   ${BLUE}Waiting for processes to stop...${NC}"
sleep 3

# Clean ports
if [ -f "./cleanup_ports.sh" ]; then
    echo -e "\n${YELLOW}[2] Cleaning ports...${NC}"
    ./cleanup_ports.sh
fi

# Database cleanup
if [ "$RESET_DB" = "false" ]; then
  echo -e "\n${YELLOW}[2.1] Skipping database wipe (flag RESET_DB=false)${NC}"
else
  echo -e "\n${YELLOW}[2.1] Cleaning up database files (default behavior)...${NC}"
  echo -e "   ${BLUE}Removing old SQLite database files to prevent schema conflicts...${NC}"
  rm -f ./packages/agent/data/*.db
  rm -f ./packages/agent/data/*.sqlite
  rm -f ./packages/**/test_memory.db
  rm -f ./packages/**/test_memory.sqlite
  echo -e "   ${GREEN}Database files removed. Fresh schema will be created on startup.${NC}"
fi

# Initialize database schema
echo -e "\n${YELLOW}[2.2] Initializing database schema...${NC}"
echo -e "   ${BLUE}Creating database tables including 'memories' table...${NC}"
node patches/init_db.cjs

# Verify critical environment variables
echo -e "\n${YELLOW}[2.3] Verifying environment variables...${NC}"
echo -e "   ${GREEN}RELAY_SERVER_URL=${RELAY_SERVER_URL}${NC}"
echo -e "   ${GREEN}TELEGRAM_GROUP_IDS=${TELEGRAM_GROUP_IDS}${NC}"
echo -e "   ${GREEN}RESET_DB=${RESET_DB:-false}${NC}"

# Check if gc scripts are available for all agents
echo -e "   ${BLUE}Verifying garbage collection scripts...${NC}"
for agent in "${agents[@]}"; do
  if [ -f "gc_${agent}.js" ]; then
    echo -e "   ${GREEN}Found GC script for ${agent}${NC}"
  else
    echo -e "   ${RED}WARNING: Missing gc_${agent}.js script!${NC}"
    echo -e "   ${YELLOW}This agent may experience memory issues without garbage collection.${NC}"
  fi
done

# Set Telegram bot tokens for each agent from .env file
echo -e "\n${YELLOW}[3.1] Configuring Telegram Bot Tokens...${NC}"

# Use tokens from .env file if available, otherwise use placeholders
export ETH_MEMELORD_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_eth_memelord_9000:-YOUR_TOKEN_HERE}"
export BAG_FLIPPER_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_bag_flipper_9000:-YOUR_TOKEN_HERE}"
export LINDA_EVANGELISTA_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_linda_evangelista_88:-YOUR_TOKEN_HERE}"
export VC_SHARK_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_vc_shark_99:-YOUR_TOKEN_HERE}"
export CODE_SAMURAI_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_code_samurai_77:-YOUR_TOKEN_HERE}"
export BITCOIN_MAXI_BOT_TOKEN="${TELEGRAM_BOT_TOKEN_bitcoin_maxi_420:-YOUR_TOKEN_HERE}"

# Show masked versions of tokens for verification
mask_token() {
    local token="$1"
    local token_length=${#token}
    
    if [ "$token_length" -le 10 ] || [ "$token" == "YOUR_TOKEN_HERE" ]; then
        echo "$token" # Return full placeholder token
    else
        local first_six=${token:0:6}
        local last_two=${token: -2}
        echo "${first_six}...${last_two}"
    fi
}

echo -e "   ETH_MEMELORD_BOT_TOKEN: $(mask_token "$ETH_MEMELORD_BOT_TOKEN")"
echo -e "   BAG_FLIPPER_BOT_TOKEN: $(mask_token "$BAG_FLIPPER_BOT_TOKEN")"
echo -e "   LINDA_EVANGELISTA_BOT_TOKEN: $(mask_token "$LINDA_EVANGELISTA_BOT_TOKEN")"
echo -e "   VC_SHARK_BOT_TOKEN: $(mask_token "$VC_SHARK_BOT_TOKEN")"
echo -e "   CODE_SAMURAI_BOT_TOKEN: $(mask_token "$CODE_SAMURAI_BOT_TOKEN")"
echo -e "   BITCOIN_MAXI_BOT_TOKEN: $(mask_token "$BITCOIN_MAXI_BOT_TOKEN")"

echo -e "   ${GREEN}Telegram bot tokens configured${NC}"

# Start relay server
echo -e "\n${YELLOW}[4] Starting relay server...${NC}"
cd relay-server
export NODE_OPTIONS="--max-old-space-size=512" # Less memory for relay
PORT=4000 nohup node server.js > ../logs/relay-server.log 2>&1 &
RELAY_PID=$!
cd ..
echo -e "   ${GREEN}Relay server started with PID: ${RELAY_PID}${NC}"

# Wait for relay to start
echo -e "   ${BLUE}Waiting for relay server to initialize...${NC}"
sleep 5

# Check if relay server is running
echo -e "\n${YELLOW}[5] Verifying relay server...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:4000/health | grep -q "status.*ok"; then
        echo -e "   ${GREEN}Relay server is up and running!${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "   ${RED}Failed to verify relay server is running. Check logs.${NC}"
        echo -e "   ${BLUE}Tail of relay log:${NC}"
        tail -n 10 $LOG_DIR/relay-server.log
        exit 1
    else
        echo -e "   ${BLUE}Waiting... ($i/10)${NC}"
        sleep 1
    fi
done

# Set environment variables for relay
export RELAY_SERVER_URL="http://localhost:4000"
export RELAY_AUTH_TOKEN=$RELAY_AUTH_TOKEN
export TELEGRAM_GROUP_IDS=$TELEGRAM_GROUP_IDS

# Define agents to launch
agents=("eth_memelord_9000" "bag_flipper_9000" "linda_evangelista_88" "vc_shark_99" "bitcoin_maxi_420" "code_samurai_77")
PORT=3000

# Launch GC helper scripts
echo -e "\n${YELLOW}[6] Starting Garbage Collection helper scripts...${NC}"
for agent in "${agents[@]}"; do
    node gc_${agent}.js > $LOG_DIR/gc_${agent}.log 2>&1 &
    GC_PID=$!
    echo -e "   ${GREEN}Started GC helper for ${agent} with PID: ${GC_PID}${NC}"
    echo $GC_PID > $LOG_DIR/gc_${agent}.pid
done

# Manual Agent Startup (per-terminal isolation)
echo -e "\n${YELLOW}[7] Manual Agent Startup${NC}"
echo -e "   ${BLUE}Please run each agent manually in its own terminal using the patched launcher:${NC}"
echo -e "   ${YELLOW}# ETH Memelord (Port 3000)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/eth_memelord_9000.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3000 --log-level=debug"
echo -e "   ${YELLOW}# Bag Flipper (Port 3001)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/bag_flipper_9000.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3001 --log-level=debug"
echo -e "   ${YELLOW}# Linda Evangelista (Port 3002)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/linda_evangelista_88.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3002 --log-level=debug"
echo -e "   ${YELLOW}# VC Shark (Port 3003)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/vc_shark_99.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3003 --log-level=debug"
echo -e "   ${YELLOW}# Bitcoin Maxi (Port 3004)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/bitcoin_maxi_420.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3004 --log-level=debug"
echo -e "   ${YELLOW}# Code Samurai (Port 3005)${NC}"
echo -e "   node patches/start-agent-with-patches.js --characters=\"/root/eliza/packages/agent/src/characters/code_samurai_77.json\" --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent,@elizaos/plugin-bootstrap --port=3005 --log-level=debug"

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    VALHALLA IS OPERATIONAL ⚔️  🛡️         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 