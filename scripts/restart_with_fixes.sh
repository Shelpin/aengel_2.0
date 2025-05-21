#!/bin/bash
# Valhalla Fix Implementation Restart Script

echo "🚀 Restarting system with Valhalla fixes..."
echo "==============================================="

# Clean up ports first
echo "🧹 Cleaning up ports..."
./cleanup_ports.sh

# Make sure relay server is running
if ! curl -s "http://localhost:4000/health" > /dev/null; then
  echo "🚦 Starting relay server..."
  cd relay-server
  ./start-relay.sh
  cd ..
  sleep 2
else
  echo "✅ Relay server is already running"
fi

# Build the package
echo "🔨 Building telegram-multiagent package..."
cd packages/telegram-multiagent
pnpm run build
cd ../..

# Restart agents
echo "🔄 Restarting agents with fixes..."
./restart_valhalla.sh

# Check agent status
echo "🔍 Checking agent status..."
sleep 5
curl -s "http://localhost:4000/health"

echo -e "\n"
echo "🏁 System restarted with Valhalla fixes!"
echo "Now run the test script to verify: ./test_valhalla_implementation.sh"
echo "===============================================" 