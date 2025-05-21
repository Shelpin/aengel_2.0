#!/bin/bash

# Test Message Sender for Valhalla
# This script sends test messages to the relay server

# Default values
RELAY_URL="http://207.180.245.243:4000"
RELAY_TOKEN="elizaos-secure-relay-key"
GROUP_ID="-1002550618173"
SENDER="eth_memelord_9000_bot"
RECEIVER="linda_evangelista_88_bot"
MESSAGE="@${RECEIVER//_bot/} What do you think about crypto?"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --relay-url)
      RELAY_URL="$2"
      shift 2
      ;;
    --token)
      RELAY_TOKEN="$2"
      shift 2
      ;;
    --group)
      GROUP_ID="$2"
      shift 2
      ;;
    --sender)
      SENDER="$2"
      shift 2
      ;;
    --receiver)
      RECEIVER="$2"
      shift 2
      ;;
    --message)
      MESSAGE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Trim @ from receiver if present
RECEIVER_NAME=${RECEIVER#@}

# Add @ to receiver in message if not already there
if [[ "$MESSAGE" != *"@$RECEIVER_NAME"* && "$MESSAGE" != *"@${RECEIVER_NAME//_bot/}"* ]]; then
  MESSAGE="@${RECEIVER_NAME//_bot/} $MESSAGE"
fi

echo "🔄 Relay URL: $RELAY_URL"
echo "🎯 Group ID: $GROUP_ID"
echo "👤 Sender: $SENDER"
echo "📪 Message: $MESSAGE"

# Send the message
echo "📤 Sending message..."
RESPONSE=$(curl -s -X POST "$RELAY_URL/sendMessage" \
  -H "Authorization: Bearer $RELAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"message\": \"$MESSAGE\",
    \"sender\": \"$SENDER\"
  }")

# Check response
if [[ "$RESPONSE" == *"success"*"true"* ]]; then
  echo "✅ Message sent successfully!"
  echo "Response: $RESPONSE"
else
  echo "❌ Failed to send message"
  echo "Response: $RESPONSE"
fi

# Explain what to check for in the logs
echo ""
echo "📝 Check the following logs for responses:"
echo "- logs/linda_evangelista_88.log - Should show receipt of the message"
echo "- logs/relay_server.log - Should show the message being queued"
echo ""
echo "To monitor logs in real time:"
echo "  tail -f logs/linda_evangelista_88.log"
echo "  tail -f logs/relay_server.log" 