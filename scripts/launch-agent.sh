#!/bin/bash

# Usage: ./scripts/launch-agent.sh <AGENT_ID> <AGENT_PORT>

# Validate input
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: Missing arguments. Usage: $0 <AGENT_ID> <AGENT_PORT>"
  exit 1
fi

AGENT_ID=$1
AGENT_PORT=$2

# Ensure script is run from the root directory
if [ ! -f ".env" ]; then
    echo "Error: Please run this script from the project root directory."
    exit 1
fi

# --- Environment Setup ---
export AGENT_ID
export AGENT_PORT

# Standard environment variables (can be overridden if needed)
export USE_IN_MEMORY_DB="${USE_IN_MEMORY_DB:-false}"
export RELAY_SERVER_URL="${RELAY_SERVER_URL:-http://localhost:4000}"
export RELAY_AUTH_TOKEN=$(grep '^RELAY_AUTH_TOKEN=' .env | cut -d '=' -f2)
export TELEGRAM_GROUP_IDS="${TELEGRAM_GROUP_IDS:--1002550681173}" # Default group ID, override if necessary
export LOG_LEVEL="${LOG_LEVEL:-debug}"
export FORCE_GC="${FORCE_GC:-true}"
export NODE_OPTIONS="${NODE_OPTIONS:---expose-gc}"
export CHARACTER_PATH="${CHARACTER_PATH:-packages/agent/src/characters/${AGENT_ID}.json}"

# Dynamically get the correct Telegram Bot Token from .env
TOKEN_VAR_NAME="TELEGRAM_BOT_TOKEN_${AGENT_ID}"
export TELEGRAM_BOT_TOKEN=$(grep "^${TOKEN_VAR_NAME}=" .env | cut -d '=' -f2 || echo "") # Added default echo

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Error: Could not find Telegram token for agent ${AGENT_ID} in .env file (expected variable: ${TOKEN_VAR_NAME})"
    exit 1
fi

# --- Logging ---
echo "Starting agent ${AGENT_ID} on port ${AGENT_PORT}..."
echo "  Relay Server: ${RELAY_SERVER_URL}"
# Note: RELAY_AUTH_TOKEN is read but not logged for security
# Note: TELEGRAM_BOT_TOKEN is exported but not logged for security
echo "  Using DB: ${USE_IN_MEMORY_DB:-false}"
echo "  Character: ${CHARACTER_PATH}"
echo "  Using Token Variable: ${TOKEN_VAR_NAME}"

# --- Agent Startup ---
# Ensure logs directory exists
mkdir -p logs

# Run the agent startup script with patches
# Output is redirected to a log file specific to the agent ID and port
node patches/start-agent-with-patches.js \
  --isRoot \
  --characters="$CHARACTER_PATH" \
  --clients=@elizaos/client-telegram \
  --plugins=@elizaos/telegram-multiagent \
  --port="$AGENT_PORT" \
  --log-level="$LOG_LEVEL" > "logs/${AGENT_ID}_${AGENT_PORT}.log" 2>&1 &

# Give the process a moment to start
sleep 2

echo "Agent ${AGENT_ID} started in background. Log: logs/${AGENT_ID}_${AGENT_PORT}.log" 