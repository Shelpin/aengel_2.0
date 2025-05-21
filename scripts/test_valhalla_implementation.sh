#!/bin/bash
# Valhalla Implementation Test Script

echo "🔍 Valhalla Implementation Test"
echo "========================================"

# Configuration
RELAY_URL="http://localhost:4000"
RELAY_TOKEN="elizaos-secure-relay-key"
GROUP_ID="-1002550618173"
FROM_AGENT="eth_memelord_9000_bot"
TO_AGENT="linda_evangelista_88_bot"

echo "📋 Configuration:"
echo "  Relay URL: $RELAY_URL"
echo "  Group ID: $GROUP_ID"
echo "  Sender: $FROM_AGENT"
echo "  Receiver: $TO_AGENT"

# Check if relay server is running
echo "🔄 Checking if relay server is running..."
if ! curl -s "$RELAY_URL/health" > /dev/null; then
  echo "❌ Relay server is not running. Please start it first."
  exit 1
fi

# Get current health status
echo "🏥 Checking relay server health..."
HEALTH_OUTPUT=$(curl -s "$RELAY_URL/health")
echo "$HEALTH_OUTPUT" | grep -o '"agents":[^,]*' | sed 's/"agents"://g'
echo "$HEALTH_OUTPUT" | grep -o '"agents_list":\[[^]]*\]' | sed 's/"agents_list"://g'

# Send a test message
echo "📤 Sending test message from $FROM_AGENT to $TO_AGENT..."
curl -X POST "$RELAY_URL/sendMessage" \
  -H "Authorization: Bearer $RELAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$FROM_AGENT\",
    \"chat_id\": \"$GROUP_ID\",
    \"text\": \"@$TO_AGENT Hi Linda! Is this working now? Testing the Valhalla implementation.\",
    \"sender_agent_id\": \"$FROM_AGENT\"
  }"

echo -e "\n"
echo "✅ Test message sent. Check the logs for both bots to see if the message was properly handled."
echo "💡 Suggested commands:"
echo "  tail -f logs/${TO_AGENT}.log | grep 'runtime.handleMessage'"
echo "  tail -f logs/relay_server.log | grep 'SendMessage'"
echo "========================================" 