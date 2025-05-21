#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting FORCE_RUNTIME_AVAILABLE=true in environment${NC}"

# Update service files to include the force runtime environment variable
for agent in linda_evangelista_88 vc_shark_99 bitcoin_maxi_420 eth_memelord_9000 bag_flipper_9000 code_samurai_77; do
    echo -e "${BLUE}Updating environment for $agent${NC}"
    
    # Find the service file
    service_file="/etc/systemd/system/elizaos-agent-$agent.service"
    
    # Check if service file exists
    if [ -f "$service_file" ]; then
        # Add environment variable if not already present
        if ! grep -q "FORCE_RUNTIME_AVAILABLE=true" "$service_file"; then
            echo -e "${BLUE}Adding FORCE_RUNTIME_AVAILABLE to $service_file${NC}"
            # Make a backup
            cp "$service_file" "${service_file}.bak"
            # Add environment variable
            sed -i '/Environment=/ s/$/ FORCE_RUNTIME_AVAILABLE=true/' "$service_file"
        else
            echo -e "${GREEN}FORCE_RUNTIME_AVAILABLE already set for $agent${NC}"
        fi
    else
        echo -e "${RED}Service file not found for $agent${NC}"
    fi
done

# Reload systemd
echo -e "${BLUE}Reloading systemd daemon${NC}"
systemctl daemon-reload

# Restart the agents
echo -e "${BLUE}Restarting all agents${NC}"
for agent in linda_evangelista_88 vc_shark_99 bitcoin_maxi_420 eth_memelord_9000 bag_flipper_9000 code_samurai_77; do
    echo -e "${BLUE}Restarting $agent${NC}"
    systemctl restart elizaos-agent-$agent
    sleep 2
done

# Wait for agents to initialize
echo -e "${BLUE}Waiting for agents to initialize...${NC}"
sleep 15

# Force a conversation kickstart with our test script
echo -e "${GREEN}Forcing conversation between bots${NC}"
cd /root/eliza/packages/telegram-multiagent && node scripts/test_bot_conversation.js

echo -e "${GREEN}Done! Check the logs to see if the bots are communicating properly.${NC}"
echo -e "${BLUE}Run 'tail -f /root/eliza/logs/*.log | grep BOT2BOT' to see bot-to-bot messages${NC}" 