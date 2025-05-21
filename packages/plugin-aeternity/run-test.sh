#!/bin/bash

# Run telegram tipping test for Aeternity plugin

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building the plugin..."
pnpm build || echo "Build command not found, proceeding with test"

echo "🧪 Running Telegram tipping test..."
pnpm tsx test-telegram-tip.ts

echo "✅ Test completed" 