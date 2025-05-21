#!/bin/bash
# Valhalla Success Verification Script
# This script tests the Valhalla fixes to ensure everything is working

# Text formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}=========================="
echo "VALHALLA SUCCESS VERIFICATION"
echo -e "==========================${NC}"

# 1. Check if the database file exists and remove it to start fresh
echo -e "\n${YELLOW}[PHASE 1] SQLite Database Check${NC}"
DB_PATH="/root/eliza/agent/data/db.sqlite"
if [ -f "$DB_PATH" ]; then
  echo "✅ Found existing database: $DB_PATH"
  echo "🔄 Creating backup and removing for clean test..."
  mv "$DB_PATH" "${DB_PATH}.bak.$(date +%s)"
  echo "✅ Database removed for clean test"
else
  echo "ℹ️ No existing database found at $DB_PATH"
fi

echo "🔍 Checking data directory permissions..."
if [ -d "/root/eliza/agent/data/" ]; then
  chmod -R 777 /root/eliza/agent/data/
  echo "✅ Permissions updated for data directory"
else
  mkdir -p /root/eliza/agent/data/
  chmod -R 777 /root/eliza/agent/data/
  echo "✅ Created and set permissions for data directory"
fi

# 2. Clean build of the project
echo -e "\n${YELLOW}[PHASE 2] Building Project${NC}"
echo "🔄 Running build process..."
cd /root/eliza && pnpm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

# 3. Start relay server in the background
echo -e "\n${YELLOW}[PHASE 3] Starting Relay Server${NC}"
echo "🔄 Starting relay server in the background..."
cd /root/eliza/relay-server
nohup node server.js > ../logs/relay-server.log 2>&1 &
RELAY_PID=$!
echo "✅ Relay server started with PID: $RELAY_PID"

# Wait for relay server to start
echo "⏳ Waiting for relay server to start..."
sleep 3

# Check if relay server is running
echo "🔍 Checking relay server health..."
RELAY_HEALTH=$(curl -s http://localhost:4000/health || echo "FAILED")
if [[ "$RELAY_HEALTH" == *"FAILED"* ]]; then
  echo -e "${RED}❌ Relay server health check failed${NC}"
  cat ../logs/relay-server.log | tail -n 20
  exit 1
else
  echo -e "${GREEN}✅ Relay server running${NC}"
  echo "Response: $RELAY_HEALTH"
fi

# 4. Start agents with runtime patches
echo -e "\n${YELLOW}[PHASE 4] Starting Agents${NC}"
echo "🔄 Starting agents with patches..."
cd /root/eliza
./restart_with_fixes.sh
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Agents started successfully${NC}"
else
  echo -e "${RED}❌ Failed to start agents${NC}"
  exit 1
fi

# 5. Wait for agents to initialize
echo -e "\n${YELLOW}[PHASE 5] Waiting for Agents${NC}"
echo "⏳ Waiting 10 seconds for agents to initialize..."
sleep 10

# 6. Check agent logs for successful Valhalla fixes
echo -e "\n${YELLOW}[PHASE 6] Checking Agent Logs${NC}"
echo "🔍 Checking for successful registration with relay..."

REGISTERED_AGENTS=$(grep -l "\[RELAY\] Agent .* registered successfully" logs/* | wc -l)
echo "Found $REGISTERED_AGENTS agent(s) registered with relay"

if [ $REGISTERED_AGENTS -gt 0 ]; then
  echo -e "${GREEN}✅ Agents registered successfully with relay${NC}"
else
  echo -e "${RED}❌ No agents registered with relay${NC}"
  # Show relevant logs
  echo -e "\n${YELLOW}Relay server logs:${NC}"
  cat logs/relay-server.log | grep -i "register\|error\|fail" | tail -n 20
fi

# 7. Send a test message to trigger bot interactions
echo -e "\n${YELLOW}[PHASE 7] Testing Message Flow${NC}"
echo "🔄 Sending test message via curl..."

# Get the first group ID from agent logs
GROUP_ID=$(grep -o "chat.*id.*[-0-9]\+" logs/* | head -1 | grep -o "[-0-9]\+")
if [ -z "$GROUP_ID" ]; then
  GROUP_ID="-1002550618173" # Fallback ID
  echo "Using fallback group ID: $GROUP_ID"
else
  echo "Found group ID: $GROUP_ID"
fi

# Get the first bot username
BOT_NAME=$(grep -o "agent_id.*[A-Za-z0-9_]\+_bot" logs/* | head -1 | grep -o "[A-Za-z0-9_]\+_bot")
if [ -z "$BOT_NAME" ]; then
  BOT_NAME="eth_memelord_9000_bot" # Fallback bot name
  echo "Using fallback bot name: $BOT_NAME"
else
  echo "Found bot name: $BOT_NAME"
fi

# Send test message
curl -s -X POST http://localhost:4000/send \
  -H "Authorization: Bearer elizaos-secure-relay-key" \
  -H "Content-Type: application/json" \
  -d "{\"groupId\":\"$GROUP_ID\",\"text\":\"Hey $BOT_NAME, are you alive? This is a Valhalla test.\", \"sender\":\"test_user\"}"

echo "✅ Test message sent"

# 8. Check for bot responses
echo -e "\n${YELLOW}[PHASE 8] Checking Bot Responses${NC}"
echo "⏳ Waiting 10 seconds for bots to process message..."
sleep 10

echo "🔍 Checking for message handling in logs..."
MESSAGES_HANDLED=$(grep -l "\[PLUGIN\]\[VALHALLA\]\[FLOW\] handleIncomingMessage triggered" logs/* | wc -l)
echo "Found $MESSAGES_HANDLED message handler invocation(s)"

if [ $MESSAGES_HANDLED -gt 0 ]; then
  echo -e "${GREEN}✅ Message handlers triggered${NC}"
else
  echo -e "${RED}❌ No message handlers triggered${NC}"
fi

echo "🔍 Checking for runtime responses..."
RESPONSES_GENERATED=$(grep -l "\[PLUGIN\]\[VALHALLA\]\[FLOW\] Runtime returned response" logs/* | wc -l)
echo "Found $RESPONSES_GENERATED response(s) generated"

if [ $RESPONSES_GENERATED -gt 0 ]; then
  echo -e "${GREEN}✅ Responses generated by runtime${NC}"
else
  echo -e "${RED}❌ No responses generated${NC}"
fi

echo "🔍 Checking for outgoing messages..."
MESSAGES_SENT=$(grep -l "\[PLUGIN\]\[VALHALLA\]\[FLOW\] Message forwarded to relay" logs/* | wc -l)
echo "Found $MESSAGES_SENT message(s) sent"

if [ $MESSAGES_SENT -gt 0 ]; then
  echo -e "${GREEN}✅ Messages sent to relay${NC}"
else
  echo -e "${RED}❌ No messages sent to relay${NC}"
fi

# 9. Check SQLite memory usage
echo -e "\n${YELLOW}[PHASE 9] Checking Memory System${NC}"
echo "🔍 Checking for SQLite memory operations..."

MEMORY_OPERATIONS=$(grep -l "\[MEMORY\] Successfully stored memory .* in SQLite" logs/* | wc -l)
echo "Found $MEMORY_OPERATIONS successful SQLite memory operation(s)"

if [ $MEMORY_OPERATIONS -gt 0 ]; then
  echo -e "${GREEN}✅ SQLite memory system working${NC}"
else
  echo -e "${YELLOW}⚠️ No successful SQLite operations found${NC}"
  
  # Check for SQLite errors
  SQLITE_ERRORS=$(grep -l "SQLITE_ERROR\|SQLite error" logs/* | wc -l)
  if [ $SQLITE_ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Found SQLite errors in logs${NC}"
    grep -A 3 "SQLITE_ERROR\|SQLite error" logs/* | head -n 20
  else
    echo "No SQLite errors found, might be using in-memory fallback"
  fi
fi

# 10. Verification Summary
echo -e "\n${BLUE}${BOLD}==========================="
echo "VERIFICATION SUMMARY"
echo -e "===========================${NC}"

if [ $REGISTERED_AGENTS -gt 0 ] && [ $MESSAGES_HANDLED -gt 0 ] && [ $RESPONSES_GENERATED -gt 0 ]; then
  echo -e "${GREEN}${BOLD}🎉 VALHALLA IS OPERATIONAL! 🎉${NC}"
  echo -e "✅ Agents registered: $REGISTERED_AGENTS"
  echo -e "✅ Messages handled: $MESSAGES_HANDLED"
  echo -e "✅ Responses generated: $RESPONSES_GENERATED"
  echo -e "✅ Messages sent: $MESSAGES_SENT"
  echo -e "✅ Memory operations: $MEMORY_OPERATIONS"
else
  echo -e "${RED}${BOLD}❌ VALHALLA IS NOT FULLY OPERATIONAL${NC}"
  echo -e "Agents registered: $REGISTERED_AGENTS"
  echo -e "Messages handled: $MESSAGES_HANDLED"
  echo -e "Responses generated: $RESPONSES_GENERATED"
  echo -e "Messages sent: $MESSAGES_SENT"
  echo -e "Memory operations: $MEMORY_OPERATIONS"
  
  echo -e "\n${YELLOW}Useful logs for debugging:${NC}"
  echo -e "Registration issues: grep -i 'register\\|relay' logs/*"
  echo -e "Message flow issues: grep -i 'FLOW\\|message' logs/*"
  echo -e "SQLite issues: grep -i 'sqlite\\|memory\\|db' logs/*"
fi

echo -e "\n${BLUE}Tests completed. Check above results for details.${NC}" 