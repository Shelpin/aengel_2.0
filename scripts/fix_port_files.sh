#!/bin/bash

# This script fixes port files to ensure correct format and uniqueness

echo "🔧 Fixing port files to ensure proper format and assignments..."

PORT_DIR="/root/eliza/ports"
mkdir -p "$PORT_DIR"

# Define agent port mapping
declare -A AGENT_PORTS=(
    ["eth_memelord_9000"]="3000"
    ["bag_flipper_9000"]="3001"
    ["linda_evangelista_88"]="3002"
    ["vc_shark_99"]="3003"
    ["bitcoin_maxi_420"]="3004"
    ["code_samurai_77"]="3005"
)

# Get all existing port files
PORT_FILES=$(find "$PORT_DIR" -name "*.port")

# First pass: Read all existing port files to see what ports are used
declare -A USED_PORTS=()
for file in $PORT_FILES; do
    agent=$(basename "$file" .port)
    
    # Read the port number
    if grep -q "^PORT=" "$file"; then
        port=$(grep "^PORT=" "$file" | cut -d'=' -f2 | tr -d '[:space:]')
        
        # Only process valid port numbers
        if [[ "$port" =~ ^[0-9]+$ ]]; then
            # Mark this port as used by this agent
            USED_PORTS["$port"]="$agent"
        fi
    fi
done

# Check for duplicate port assignments
declare -A CONFLICTS=()
for agent in "${!AGENT_PORTS[@]}"; do
    preferred_port="${AGENT_PORTS[$agent]}"
    
    # Check if preferred port is used by another agent
    if [[ -n "${USED_PORTS[$preferred_port]}" && "${USED_PORTS[$preferred_port]}" != "$agent" ]]; then
        CONFLICTS["$agent"]="${USED_PORTS[$preferred_port]}"
    fi
done

# Update port files with correct format
for agent in "${!AGENT_PORTS[@]}"; do
    file="$PORT_DIR/$agent.port"
    
    # Get the correct port to assign
    port="${AGENT_PORTS[$agent]}"
    
    # Read the existing file content after the first line
    json_content=""
    if [ -f "$file" ]; then
        # Skip the first line (old port) and capture the rest
        json_content=$(sed '1d' "$file")
    fi
    
    # If no JSON content, create a minimal default
    if [ -z "$json_content" ]; then
        json_content='{
  "name": "'"$(echo "$agent" | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')"'",
  "botUsername": "'"$agent"'_bot",
  "traits": {
    "primary": ["Analytical", "Creative"],
    "secondary": ["Enthusiastic", "Curious"]
  },
  "interests": ["Blockchain", "Cryptocurrency", "Technology"],
  "typingSpeed": 300,
  "responseDelayMultiplier": 1.0,
  "conversationInitiationWeight": 1.0,
  "aeternityProScore": 5
}'
    fi
    
    # Write the updated port file
    echo "PORT=$port" > "$file"
    echo "" >> "$file"
    echo "$json_content" >> "$file"
    
    echo "✅ Updated $agent port file with PORT=$port"
done

echo "🧩 Port assignments fixed!"

# Create a backup of port files
BACKUP_DIR="/root/eliza/ports_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$PORT_DIR"/*.port "$BACKUP_DIR"
echo "📂 Port files backed up to $BACKUP_DIR" 