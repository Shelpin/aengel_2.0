#!/bin/bash

# VALHALLA RELAUNCH SCRIPT (STEP 5)
# Based on the post_OOM_world.md action plan

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│         VALHALLA RELAUNCH SCRIPT        │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"

# Stop all existing agents and services
echo -e "${YELLOW}[1] Stopping any running agents and services${NC}"
if [ -f "./stop_agents.sh" ]; then
  ./stop_agents.sh
else
  pkill -f "node.*agent" || true
fi
pkill -f "node.*server.js" || true

echo -e "   ${BLUE}Waiting for processes to fully stop...${NC}"
sleep 5

# Clean databases
if [ "$RESET_DB" = "false" ]; then
  echo -e "\n${YELLOW}[2] Skipping database wipe (flag RESET_DB=false)${NC}"
else
  echo -e "\n${YELLOW}[2] Cleaning up old memory databases (default behavior)...${NC}"
  rm -f ./agent/data/*.db
  rm -f ./packages/telegram-multiagent/test_memory.db
  echo -e "   ${GREEN}Database files removed successfully${NC}"
fi

# Consolidated build step after DB init
echo -e "\n${YELLOW}[3] Running consolidated clean build...${NC}"
pnpm recursive run clean
rm -rf node_modules
pnpm install

# --- Explicitly build core first --- 
echo -e "   ${BLUE}Attempting explicit build of @elizaos/core...${NC}"
pnpm -F @elizaos/core run clean 
pnpm -F @elizaos/core run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Explicit build of @elizaos/core failed! Check errors above.${NC}"
  exit 1
else
  echo -e "   ${GREEN}Explicit build of @elizaos/core successful.${NC}"
fi
# --- End explicit build ---

pnpm recursive run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Check errors above.${NC}"
  exit 1
else
  echo -e "${GREEN}Build successful!${NC}"
fi

# Start Valhalla
echo -e "\n${YELLOW}[4] Launching Valhalla with fixed configuration${NC}"
echo -e "   ${BLUE}Setting environment variables:${NC}"
export DISABLE_POLLING=true
export FORCE_GC=true

# Load and export environment variables from .env
set -a && [ -f ".env" ] && source .env && set +a

# Run the main launch script
echo -e "\n${YELLOW}[5] Executing launch_valhalla.sh${NC}"
./launch_valhalla.sh

# Check agent status
echo -e "\n${YELLOW}[6] Waiting 10 seconds for system to initialize${NC}"
sleep 10

echo -e "\n${YELLOW}[7] Starting agent monitoring${NC}"
echo -e "   ${BLUE}Run this command to monitor all agents:${NC}"
echo -e "   ${YELLOW}./monitor_agents.sh -w -a${NC}"
echo
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│        VALHALLA RELAUNCH COMPLETE       │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 