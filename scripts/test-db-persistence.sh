#!/bin/bash

# Test Database Persistence Script
# This script verifies persistence of conversation state across restarts

# Set default values
GROUP_ID=${1:-"test_group"}
AGENT_ID=${2:-${AGENT_ID:-"eth_memelord_9000"}}

echo "🧪 Testing persistence for group: $GROUP_ID, agent: $AGENT_ID"

# Ensure directories exist
mkdir -p logs

# Run the persistence test
NODE_OPTIONS="--experimental-specifier-resolution=node" node --input-type=module -e "
  import { testPersistence } from './packages/telegram-multiagent/src/utils/DbTest.js';
  testPersistence('$GROUP_ID', '$AGENT_ID')
    .then(() => console.log('✅ Test completed'))
    .catch(err => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
" 2>&1 | tee -a logs/db-persistence-test.log

echo "🔍 See logs/db-persistence-test.log for details"
echo "🔄 Run the script again to verify that state persists between runs" 