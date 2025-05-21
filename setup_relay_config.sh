#!/bin/bash

# Script to update relay configuration for all agents
# This ensures each agent can connect to the relay server

set -e # Exit on error

echo "Setting up Telegram relay configuration for all agents..."

# Create the plugin config directory if it doesn't exist
PLUGIN_DIR="/root/eliza/agent/config/plugins"
mkdir -p $PLUGIN_DIR

# Create telegram-multiagent.json config if it doesn't exist
CONFIG_FILE="$PLUGIN_DIR/telegram-multiagent.json"

cat > $CONFIG_FILE << EOF
{
  "relayServerUrl": "http://localhost:4000", 
  "authToken": "elizaos-secure-relay-key",
  "groupIds": [-1002550618173],
  "conversationCheckIntervalMs": 30000,
  "enabled": true,
  "typingSimulation": {
    "enabled": true,
    "baseTypingSpeedCPM": 300,
    "randomVariation": 0.2
  }
}
EOF

# Set permissions
chmod 640 $CONFIG_FILE

echo "Created telegram-multiagent.json config file at $CONFIG_FILE"

# Restart the relay server (clean start)
echo "Stopping any existing relay servers..."
pkill -f "node.*server.js" || echo "No relay server running"
sleep 2

echo "Starting relay server..."
cd /root/eliza && ./relay-server/start-relay.sh > logs/relay-server.log 2>&1 &
sleep 5

echo "Verifying the relay server is running..."
if curl -s http://localhost:4000/health | grep -q "status.*ok"; then
  echo "✅ Relay server is running correctly"
else
  echo "❌ Relay server did not start properly. Check logs/relay-server.log"
  exit 1
fi

echo "Restarting agents to pick up new configuration..."
cd /root/eliza && ./stop_agents.sh
sleep 2
cd /root/eliza && ./start_agents.sh

echo "Configuration setup complete!"
echo "Use './monitor_agents.sh -w' to watch agent logs" 