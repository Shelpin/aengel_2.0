#!/bin/bash

# Direct Telegram Message Sender for Valhalla
# This script sends test messages directly to the Telegram API

# Default values
CHAT_ID="-1002550618173"
RECEIVER="linda_evangelista_88"
MESSAGE="Hey @${RECEIVER}, do you still believe in Bitcoin?"

# Load tokens from .env if available
if [ -f .env ]; then
  source .env
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --token)
      BOT_TOKEN="$2"
      shift 2
      ;;
    --chat)
      CHAT_ID="$2"
      shift 2
      ;;
    --receiver)
      RECEIVER="$2"
      # Strip _bot suffix if present
      RECEIVER=${RECEIVER%_bot}
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

# Prompt for bot token if not provided
if [ -z "$BOT_TOKEN" ]; then
  echo "Enter your bot token (or set it with --token):"
  read -s BOT_TOKEN
  echo ""
fi

# Check for required parameters
if [ -z "$BOT_TOKEN" ]; then
  echo "❌ Bot token is required. Use --token or set TELEGRAM_BOT_TOKEN in .env"
  exit 1
fi

# Add @ to receiver in message if not already there and receiver is specified
if [ -n "$RECEIVER" ] && [[ "$MESSAGE" != *"@$RECEIVER"* ]]; then
  MESSAGE="@$RECEIVER $MESSAGE"
fi

echo "🎯 Chat ID: $CHAT_ID"
echo "📪 Message: $MESSAGE"

# URL encode the message
MESSAGE_ENCODED=$(echo -n "$MESSAGE" | jq -s -R -r @uri)

# Send the message
echo "📤 Sending message..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=$MESSAGE_ENCODED")

# Check response
if [[ "$RESPONSE" == *"\"ok\":true"* ]]; then
  echo "✅ Message sent successfully!"
  echo "Response: $RESPONSE"
else
  echo "❌ Failed to send message"
  echo "Response: $RESPONSE"
fi

# Explain what to check for in the logs
echo ""
echo "📝 Check the following logs for responses:"
echo "- logs/${RECEIVER}_88.log - Should show receipt of the message"
echo ""
echo "To monitor logs in real time:"
echo "  tail -f logs/${RECEIVER}_88.log" 