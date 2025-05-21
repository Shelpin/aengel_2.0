#!/bin/bash

# Valhalla Multi-Agent System Fix & Restart Script
# This script applies all necessary fixes and restarts the system

set -e  # Exit on errors

# Configuration
RELAY_SERVER_DIR="/root/eliza/relay-server"
LOG_DIR="/root/eliza/logs"
PLUGIN_DIR="/root/eliza/agent/config/plugins"
TELEGRAM_GROUP_IDS="-1002550618173"
RELAY_PORT=4000
RELAY_AUTH_TOKEN="elizaos-secure-relay-key"
HEARTBEAT_INTERVAL=10000  # 10 seconds

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│   VALHALLA FIX & RESTART SCRIPT v1.0    │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"
echo

# Create necessary directories
mkdir -p $LOG_DIR $PLUGIN_DIR

# Stop all processes first
echo -e "${YELLOW}[1] Stopping all processes...${NC}"

# Stop all agent processes
echo -e "   ${BLUE}Stopping agents...${NC}"
if [ -f "./stop_agents.sh" ]; then
  ./stop_agents.sh all
else
  echo -e "   ${RED}stop_agents.sh not found, manually killing processes...${NC}"
  pkill -f "node.*agent" || true
fi

# Stop relay server
echo -e "   ${BLUE}Stopping relay server...${NC}"
if [ -f "$RELAY_SERVER_DIR/stop-relay.sh" ]; then
  cd $RELAY_SERVER_DIR && ./stop-relay.sh && cd - > /dev/null
else
  echo -e "   ${RED}stop-relay.sh not found, manually killing processes...${NC}"
  pkill -f "node.*server.js" || true
fi

echo -e "   ${BLUE}Waiting for processes to stop...${NC}"
sleep 3

# Clear logs
echo -e "\n${YELLOW}[2] Clearing logs...${NC}"
if [ -f "./clear_logs.sh" ]; then
  ./clear_logs.sh
else
  echo -e "   ${BLUE}No clear_logs.sh found, deleting log files manually...${NC}"
  rm -f $LOG_DIR/*.log || true
fi

# Clean up ports to avoid conflicts
echo -e "\n${YELLOW}[3] Cleaning up ports to avoid conflicts...${NC}"
if [ -f "./cleanup_ports.sh" ]; then
  echo -e "   ${BLUE}Running port cleanup...${NC}"
  ./cleanup_ports.sh
  echo -e "   ${GREEN}Port cleanup complete!${NC}"
else
  echo -e "   ${RED}Warning: cleanup_ports.sh not found!${NC}"
  echo -e "   ${BLUE}Attempting manual port cleanup...${NC}"
  
  # Simple manual port cleanup
  for port in {3000..3010}; do
    pid=$(lsof -i :$port -t 2>/dev/null || true)
    if [ -n "$pid" ]; then
      echo -e "   ${BLUE}Killing process using port $port...${NC}"
      kill -9 $pid 2>/dev/null || true
    fi
  done
  
  # Clean up PID files
  rm -f $LOG_DIR/*.pid 2>/dev/null || true
  
  echo -e "   ${BLUE}Manual port cleanup complete${NC}"
fi

# Fix @elizaos/core dependency issue for patches
echo -e "\n${YELLOW}[4] Fixing @elizaos/core dependency for patches...${NC}"
if [ -f "./fix_elizaos_core.sh" ]; then
  echo -e "   ${BLUE}Running fix_elizaos_core.sh...${NC}"
  ./fix_elizaos_core.sh
  echo -e "   ${GREEN}@elizaos/core dependency fix complete!${NC}"
else
  echo -e "   ${RED}Warning: fix_elizaos_core.sh not found!${NC}"
  echo -e "   ${BLUE}You might encounter errors with runtime patches.${NC}"
fi

# Configure plugin
echo -e "\n${YELLOW}[5] Configuring Telegram Multi-Agent Plugin...${NC}"

CONFIG_FILE="$PLUGIN_DIR/telegram-multiagent.json"
if [ -f "$CONFIG_FILE" ]; then
  echo -e "   ${BLUE}Updating existing configuration...${NC}"
  
  # Determine server IP
  SERVER_IP="207.180.245.243"  # Default external IP
  if [ -z "$SERVER_IP" ]; then
    # If external IP not available, try to get local IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
      # Fall back to localhost only if no other IP is available
      SERVER_IP="localhost"
      echo -e "   ${RED}Warning: Using localhost for relay server.${NC}"
    fi
  fi
  
  # Backup existing config
  cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"
  
  # Update configuration
  # Update relay server URL if needed
  if grep -q "\"relayServerUrl\".*localhost" "$CONFIG_FILE"; then
    echo -e "   ${BLUE}Updating relay server URL from localhost to external IP...${NC}"
    sed -i "s|\"relayServerUrl\".*|\"relayServerUrl\": \"http://${SERVER_IP}:${RELAY_PORT}\",|" "$CONFIG_FILE"
  fi
  
  # Add/update heartbeat interval
  if grep -q "\"heartbeatInterval\"" "$CONFIG_FILE"; then
    echo -e "   ${BLUE}Updating heartbeat interval...${NC}"
    sed -i "s|\"heartbeatInterval\".*|\"heartbeatInterval\": ${HEARTBEAT_INTERVAL},|" "$CONFIG_FILE"
  else
    echo -e "   ${BLUE}Adding heartbeat interval...${NC}"
    sed -i "s|}$/,\n  \"heartbeatInterval\": ${HEARTBEAT_INTERVAL}\n}/" "$CONFIG_FILE"
  fi
  
  # Ensure the plugin is enabled
  if grep -q "\"enabled\".*false" "$CONFIG_FILE"; then
    echo -e "   ${BLUE}Enabling the plugin...${NC}"
    sed -i 's|"enabled".*false|"enabled": true|g' "$CONFIG_FILE"
  fi
  
  echo -e "   ${GREEN}Plugin configuration updated!${NC}"
else
  echo -e "   ${BLUE}Creating new plugin configuration...${NC}"
  # Create new config file
  cat > $CONFIG_FILE << EOF
{
  "relayServerUrl": "http://207.180.245.243:${RELAY_PORT}", 
  "authToken": "${RELAY_AUTH_TOKEN}",
  "groupIds": [${TELEGRAM_GROUP_IDS}],
  "conversationCheckIntervalMs": 30000,
  "enabled": true,
  "typingSimulation": {
    "enabled": true,
    "baseTypingSpeedCPM": 300,
    "randomVariation": 0.2
  },
  "heartbeatInterval": ${HEARTBEAT_INTERVAL}
}
EOF
  echo -e "   ${GREEN}Plugin configuration created!${NC}"
fi

chmod 640 $CONFIG_FILE
echo -e "   ${BLUE}Plugin configuration file permissions set!${NC}"

# Set environment variables
echo -e "\n${YELLOW}[6] Setting environment variables...${NC}"
export HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
export RELAY_SERVER_URL="http://207.180.245.243:$RELAY_PORT"
export RELAY_AUTH_TOKEN=$RELAY_AUTH_TOKEN
export TELEGRAM_GROUP_IDS=$TELEGRAM_GROUP_IDS
export PORT=$RELAY_PORT

echo -e "   ${BLUE}Environment variables set:${NC}"
echo -e "   - RELAY_SERVER_URL=${RELAY_SERVER_URL}"
echo -e "   - HEARTBEAT_INTERVAL=${HEARTBEAT_INTERVAL}"
echo -e "   - TELEGRAM_GROUP_IDS=${TELEGRAM_GROUP_IDS}"

# Start relay server
echo -e "\n${YELLOW}[7] Starting relay server...${NC}"
cd $RELAY_SERVER_DIR
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
for i in {1..15}; do
  if curl -s http://localhost:$RELAY_PORT/health | grep -q "status.*ok"; then
    echo -e "   ${GREEN}Relay server is up and running!${NC}"
    break
  elif [ $i -eq 15 ]; then
    echo -e "   ${RED}Failed to verify relay server. Check logs.${NC}"
    echo -e "   ${BLUE}Last 10 lines of relay log:${NC}"
    tail -n 10 $LOG_DIR/relay-server.log
    exit 1
  else
    echo -e "   ${BLUE}Waiting... ($i/15)${NC}"
    sleep 1
  fi
done

# Start all agents
echo -e "\n${YELLOW}[8] Starting all agents...${NC}"
if [ -f "./start_agents.sh" ]; then
  ./start_agents.sh
else
  echo -e "   ${RED}Error: start_agents.sh not found!${NC}"
  exit 1
fi

# Verify agents are running
echo -e "\n${YELLOW}[9] Verifying agent connections...${NC}"
echo -e "   ${BLUE}Waiting 15 seconds for agents to initialize...${NC}"
sleep 15

# Check relay health
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

# Run verification scripts
echo -e "\n${YELLOW}[10] Running verification tests...${NC}"
if [ -f "./verifyFixes.sh" ]; then
  echo -e "   ${BLUE}Running verification for eth_memelord_9000_bot...${NC}"
  ./verifyFixes.sh eth_memelord_9000_bot
else
  echo -e "   ${YELLOW}Skipping verification - script not found${NC}"
  echo -e "   ${BLUE}You can manually run: ./verifyFixes.sh <agent_name>${NC}"
fi

echo -e "\n${GREEN}✅ Valhalla system fix & restart complete!${NC}"
echo -e "${BLUE}Available commands:${NC}"
echo -e "   - ${YELLOW}./test_valhalla.sh${NC}       - Run system tests"
echo -e "   - ${YELLOW}./monitor_agents.sh -w${NC}   - Monitor agent logs"
echo -e "   - ${YELLOW}./verifyFixes.sh <agent>${NC} - Verify specific agent"
echo -e "   - ${YELLOW}tail -f $LOG_DIR/relay-server.log${NC} - View relay logs"
echo
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    VALHALLA IS OPERATIONAL ⚔️  🛡️         │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}" 