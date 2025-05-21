#!/bin/bash

# VALHALLA POLLING BUG FIX SCRIPT
# This script applies the fixes suggested in the post_OOM_world.md action plan

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│      VALHALLA POLLING BUG FIX SCRIPT    │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"

# Step 1: Verify DISABLE_POLLING is set
echo -e "${YELLOW}[1] Verifying environment variables${NC}"
if [ "$DISABLE_POLLING" = "true" ]; then
  echo -e "   ${GREEN}DISABLE_POLLING is already set to true${NC}"
else
  echo -e "   ${RED}DISABLE_POLLING is not set to true! Setting it now...${NC}"
  export DISABLE_POLLING=true
  echo -e "   ${GREEN}DISABLE_POLLING=${DISABLE_POLLING}${NC}"
fi

# Step 2: Clean up databases
echo -e "\n${YELLOW}[2] Cleaning SQLite databases${NC}"
echo -e "   ${BLUE}Removing old database files...${NC}"
rm -f ./agent/data/*.db
rm -f ./packages/telegram-multiagent/test_memory.db
echo -e "   ${GREEN}Database files removed successfully${NC}"

# Step 3: Rebuild the project to apply code changes
echo -e "\n${YELLOW}[3] Rebuilding project to apply code changes${NC}"
echo -e "   ${BLUE}Running build...${NC}"
pnpm build
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}Build successful!${NC}"
else
  echo -e "   ${RED}Build failed! Check errors above.${NC}"
  exit 1
fi

# Step 4: Restart agents
echo -e "\n${YELLOW}[4] Restarting agents with fresh state${NC}"
echo -e "   ${BLUE}Stopping any running agents...${NC}"

if [ -f "./stop_agents.sh" ]; then
  ./stop_agents.sh
else
  pkill -f "node.*agent" || true
fi

echo -e "   ${BLUE}Waiting for processes to fully stop...${NC}"
sleep 5

echo -e "   ${GREEN}Ready to restart the system with fixed configuration${NC}"
echo -e "   ${BLUE}To start the system, run:${NC}"
echo -e "   ${YELLOW}./launch_valhalla.sh${NC}"

echo
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    POLLING BUG FIX COMPLETED ✅         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 