#!/bin/bash

# Stop all running agents
echo "Stopping all running agents..."
pkill -f "elizaos-agent"

# Wait for agents to stop
sleep 2

# Enable evaluator logging
export LOG_LEVEL=debug
export LOG_ACTION_DECISIONS=true
export LOG_EVALUATOR=true

# Start agents with evaluator logging
echo "Starting agents with evaluator logging enabled..."
for agent in eth_memelord_9000 bag_flipper_9000 linda_evangelista_88 vc_shark_99 bitcoin_maxi_420 code_samurai_77; do
    echo "Starting $agent..."
    ./patches/start-agent-with-patches.js --agent $agent &
done

# Wait for agents to start
sleep 5

# Start monitoring
echo "Starting monitoring..."
./monitor_agents.sh -w -a 