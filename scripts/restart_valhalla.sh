#!/bin/bash

# Valhalla Multi-Agent System Restart Script
# This script restarts both the relay server and all agents with the required fixes

set -e  # Exit on errors

# Configuration
RELAY_SERVER_DIR="/root/eliza/relay-server"
LOG_DIR="/root/eliza/logs"
TELEGRAM_GROUP_IDS="-1002550618173"  # Update with your group ID
RELAY_PORT=4000
RELAY_AUTH_TOKEN="elizaos-secure-relay-key"
HEARTBEAT_INTERVAL=10000  # 10 seconds

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│         VALHALLA RESTART SCRIPT         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"
echo

# First, stop existing agents and relay
echo -e "${YELLOW}[1] Stopping existing processes...${NC}"

# Stop agents if they're running
if [ -f "./stop_agents.sh" ]; then
    echo -e "   ${BLUE}Stopping all agent processes...${NC}"
    ./stop_agents.sh all
else
    echo -e "   ${RED}Warning: stop_agents.sh not found, manually killing processes...${NC}"
    pkill -f "node.*agent" || true
fi

# Stop relay server if it's running
if [ -f "$RELAY_SERVER_DIR/stop-relay.sh" ]; then
    echo -e "   ${BLUE}Stopping relay server...${NC}"
    cd $RELAY_SERVER_DIR && ./stop-relay.sh
    cd - > /dev/null
else
    echo -e "   ${RED}Warning: stop-relay.sh not found, manually killing relay process...${NC}"
    pkill -f "node.*server.js" || true
fi

# Wait for processes to fully stop
echo -e "   ${BLUE}Waiting for processes to stop...${NC}"
sleep 3

# Ensure the plugin configuration is correct
echo -e "\n${YELLOW}[2] Configuring plugin settings...${NC}"
PLUGIN_DIR="/root/eliza/agent/config/plugins"
mkdir -p $PLUGIN_DIR

CONFIG_FILE="$PLUGIN_DIR/telegram-multiagent.json"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "   ${BLUE}Found existing plugin configuration...${NC}"
    # Check for heartbeat config
    if ! grep -q "heartbeatInterval" "$CONFIG_FILE"; then
        echo -e "   ${BLUE}Adding heartbeat configuration...${NC}"
        # Add heartbeat interval before the closing brace
        sed -i 's/}$/,\n  "heartbeatInterval": '$HEARTBEAT_INTERVAL'\n}/' "$CONFIG_FILE"
    fi
    echo -e "   ${GREEN}Plugin configuration updated!${NC}"
else
    echo -e "   ${BLUE}Creating new plugin configuration...${NC}"
    # Create config file with all necessary settings
    cat > $CONFIG_FILE << EOF
{
  "relayServerUrl": "http://localhost:$RELAY_PORT", 
  "authToken": "$RELAY_AUTH_TOKEN",
  "groupIds": [$TELEGRAM_GROUP_IDS],
  "conversationCheckIntervalMs": 30000,
  "enabled": true,
  "typingSimulation": {
    "enabled": true,
    "baseTypingSpeedCPM": 300,
    "randomVariation": 0.2
  },
  "heartbeatInterval": $HEARTBEAT_INTERVAL
}
EOF
    echo -e "   ${GREEN}Plugin configuration created!${NC}"
fi

# Start relay server with our fixes
echo -e "\n${YELLOW}[3] Starting relay server with fixes...${NC}"
cd $RELAY_SERVER_DIR

# Create a temporary directory for testing changes
echo -e "   ${BLUE}Setting up environment...${NC}"
export PORT=$RELAY_PORT
export RELAY_API_KEY=$RELAY_AUTH_TOKEN

# Start the relay server
echo -e "   ${BLUE}Starting relay server on port $RELAY_PORT...${NC}"
if [ -f "./start-relay.sh" ]; then
    ./start-relay.sh > $LOG_DIR/relay-server.log 2>&1 &
else
    node server.js > $LOG_DIR/relay-server.log 2>&1 &
fi
RELAY_PID=$!
echo -e "   ${GREEN}Relay server started! (PID: $RELAY_PID)${NC}"
cd - > /dev/null

# Wait for relay to initialize
echo -e "   ${BLUE}Waiting for relay server to initialize...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:$RELAY_PORT/health | grep -q "status.*ok"; then
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

# Set the relay server URL in environment for agents to use
export RELAY_SERVER_URL="http://localhost:$RELAY_PORT"
export RELAY_AUTH_TOKEN=$RELAY_AUTH_TOKEN
export HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
export TELEGRAM_GROUP_IDS=$TELEGRAM_GROUP_IDS

# Start all agents
echo -e "\n${YELLOW}[4] Starting all agents with fixes...${NC}"
echo -e "   ${BLUE}Setting environment:${NC}"
echo -e "   ${BLUE}- RELAY_SERVER_URL=${RELAY_SERVER_URL}${NC}"
echo -e "   ${BLUE}- TELEGRAM_GROUP_IDS=${TELEGRAM_GROUP_IDS}${NC}"
echo -e "   ${BLUE}- HEARTBEAT_INTERVAL=${HEARTBEAT_INTERVAL}${NC}"

if [ -f "./start_agents.sh" ]; then
    echo -e "   ${BLUE}Starting agents using start_agents.sh...${NC}"
    ./start_agents.sh
else
    echo -e "   ${RED}Error: start_agents.sh not found!${NC}"
    exit 1
fi

# Verify agents are running and connected
echo -e "\n${YELLOW}[5] Verifying agent connections...${NC}"
sleep 10 # Give agents time to start

# Check relay health to see connected agents
RELAY_HEALTH=$(curl -s http://localhost:$RELAY_PORT/health)
AGENT_COUNT=$(echo $RELAY_HEALTH | grep -o '"agents":[0-9]*' | cut -d':' -f2)
AGENT_LIST=$(echo $RELAY_HEALTH | grep -o '"agents_list":"[^"]*"' | cut -d'"' -f4)

echo -e "   ${BLUE}Agents registered with relay: $AGENT_COUNT${NC}"
echo -e "   ${BLUE}Agent IDs: $AGENT_LIST${NC}"

if [ "$AGENT_COUNT" -lt "1" ]; then
    echo -e "   ${RED}Warning: No agents connected to relay server!${NC}"
    echo -e "   ${BLUE}Check agent logs for connection issues.${NC}"
else
    echo -e "   ${GREEN}Agents successfully connected to relay!${NC}"
fi

# Run the verification script
echo -e "\n${YELLOW}[6] Running verification tests...${NC}"
if [ -f "./verifyFixes.sh" ]; then
    echo -e "   ${BLUE}Running verification for eth_memelord_9000_bot...${NC}"
    ./verifyFixes.sh eth_memelord_9000_bot
else
    echo -e "   ${YELLOW}Skipping verification - script not found${NC}"
    echo -e "   ${BLUE}You can manually run: ./verifyFixes.sh <agent_name>${NC}"
fi

echo -e "\n${GREEN}✅ Valhalla system restart complete!${NC}"
echo -e "${BLUE}To monitor agent logs:${NC}"
echo -e "   tail -f $LOG_DIR/*"
echo -e "${BLUE}To monitor relay server:${NC}" 
echo -e "   tail -f $LOG_DIR/relay-server.log"
echo -e "${BLUE}To run a full system test:${NC}"
echo -e "   ./test_valhalla.sh"
echo
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    VALHALLA IS OPERATIONAL ⚔️  🛡️         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 