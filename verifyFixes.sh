#!/bin/bash

# Valhalla Verification Script
# This script runs the verifyFixes method on a specified agent

# Check if agent parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <agent_name>"
  echo "Example: $0 eth_memelord_9000"
  exit 1
fi

AGENT=$1
AGENT_PORT=""
PORT_FILE="/root/eliza/ports/${AGENT}.port"

# Try to get the agent's port from its port file
if [ -f "$PORT_FILE" ]; then
  # Try to extract PORT value
  if grep -q "^PORT=" "$PORT_FILE"; then
    AGENT_PORT=$(grep "^PORT=" "$PORT_FILE" | cut -d'=' -f2 | tr -d '[:space:]')
  else
    # Try to get the first line as port number
    AGENT_PORT=$(head -n 1 "$PORT_FILE" | tr -d '[:space:]')
  fi
fi

# Verify port is a number
if ! [[ "$AGENT_PORT" =~ ^[0-9]+$ ]]; then
  echo "❌ Could not determine port for agent $AGENT"
  echo "Checking agent logs for port information..."
  
  # Try to extract port from agent logs
  LOG_FILE="/root/eliza/logs/${AGENT}.log"
  if [ -f "$LOG_FILE" ]; then
    PORT_LINE=$(grep -m 1 "listening on port" "$LOG_FILE")
    if [ -n "$PORT_LINE" ]; then
      AGENT_PORT=$(echo "$PORT_LINE" | grep -o '[0-9]\+' | head -1)
      echo "📋 Found port $AGENT_PORT from logs"
    fi
  fi
  
  # If still no port, try standard port mapping
  if ! [[ "$AGENT_PORT" =~ ^[0-9]+$ ]]; then
    case $AGENT in
      "eth_memelord_9000") AGENT_PORT=3000 ;;
      "bag_flipper_9000") AGENT_PORT=3001 ;;
      "linda_evangelista_88") AGENT_PORT=3002 ;;
      "vc_shark_99") AGENT_PORT=3003 ;;
      "bitcoin_maxi_420") AGENT_PORT=3004 ;;
      "code_samurai_77") AGENT_PORT=3005 ;;
      *) AGENT_PORT=3000 ;;
    esac
    echo "📋 Using standard port mapping: $AGENT_PORT"
  fi
fi

echo "🔍 Verifying fixes for agent $AGENT on port $AGENT_PORT"

# Define the verification script
VERIFY_SCRIPT="
const fetch = require('node-fetch');

async function verifyFixes() {
  try {
    console.log('Connecting to agent API...');
    const response = await fetch(\`http://localhost:${AGENT_PORT}/api/plugin/telegram-multiagent/verifyFixes\`);
    
    if (!response.ok) {
      console.error(\`Error: \${response.status} \${response.statusText}\`);
      console.log('Check if agent is running and plugin is loaded correctly');
      return;
    }
    
    const result = await response.text();
    console.log('Verification complete!');
    console.log('Check agent logs for detailed results');
  } catch (error) {
    console.error(\`Failed to connect to agent: \${error.message}\`);
    console.log('Make sure agent is running on port ${AGENT_PORT}');
  }
}

verifyFixes();
"

# Create a temporary file for the script
TEMP_SCRIPT=$(mktemp)
echo "$VERIFY_SCRIPT" > "$TEMP_SCRIPT"

# Run the verification
node "$TEMP_SCRIPT"

# Clean up temporary file
rm "$TEMP_SCRIPT"

# Display logs after verification
echo "📋 Last 30 lines of agent log:"
echo "-----------------------------------"
tail -n 30 "/root/eliza/logs/${AGENT}.log"
echo "-----------------------------------"
echo "✅ Verification complete" 