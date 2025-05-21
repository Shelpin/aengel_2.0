#!/bin/bash

# Secure bash settings
set -o nounset  # Exit when undefined variables
set -o pipefail # Properly handle pipe command failures

LOG_DIR="/root/eliza/logs"
PORT_DIR="/root/eliza/ports"
mkdir -p $LOG_DIR
mkdir -p $PORT_DIR

# Agent definitions
declare -A AGENTS=(
    ["bitcoin_maxi_420"]="TELEGRAM_BOT_TOKEN_BitcoinMaxi420"
    ["eth_memelord_9000"]="TELEGRAM_BOT_TOKEN_ETHMemeLord9000"
    ["code_samurai_77"]="TELEGRAM_BOT_TOKEN_CodeSamurai77"
    ["bag_flipper_9000"]="TELEGRAM_BOT_TOKEN_BagFlipper9000"
    ["vc_shark_99"]="TELEGRAM_BOT_TOKEN_VCShark99"
    ["linda_evangelista_88"]="TELEGRAM_BOT_TOKEN_LindAEvangelista88"
)

# Security: Function to validate input strings
validate_input() {
    local input="$1"
    # Check for potentially dangerous characters
    if [[ "$input" == *";"* || "$input" == *"|"* || "$input" == *">"* || "$input" == *"<"* || "$input" == *"&"* ]]; then
        echo "⚠️ Security warning: Invalid characters detected in input" >&2
        return 1
    fi
    return 0
}

# Function to kill a process and its children
kill_process_tree() {
    local pid="$1"
    local force="$2"
    local signal="-15"  # SIGTERM
    
    # Security: Validate PID is numeric
    if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
        echo "⚠️ Invalid PID format: $pid" >&2
        return 1
    fi
    
    if [ "$force" = true ]; then
        signal="-9"  # SIGKILL
    fi
    
    # Get all child processes
    local children
    children=$(pgrep -P "$pid" 2>/dev/null)
    
    # Kill the children first
    for child in $children; do
        # Security: Validate child PID is numeric
        if [[ "$child" =~ ^[0-9]+$ ]]; then
            kill_process_tree "$child" "$force"
        fi
    done
    
    # Kill the parent process
    if ps -p "$pid" > /dev/null 2>&1; then
        echo "  - Stopping PID $pid with signal ${signal#-}"
        kill "$signal" "$pid" 2>/dev/null
    fi
}

# Function to clean up resources for an agent
cleanup_agent_resources() {
    local character="$1"
    
    # Security: Validate character name
    if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo "⚠️ Invalid character name format: $character" >&2
        return 1
    fi
    
    local port_file="${PORT_DIR}/${character}.port"
    
    # Clean up port file
    if [ -f "$port_file" ]; then
        # Extract port number from file (either direct number or PORT=XXXX format)
        local port
        if grep -q "^PORT=" "$port_file"; then
            port=$(grep "^PORT=" "$port_file" | cut -d'=' -f2 | tr -d '[:space:]')
        else
            port=$(head -n 1 "$port_file" | tr -d '[:space:]')
        fi
        
        # Security: Validate port is numeric
        if ! [[ "$port" =~ ^[0-9]+$ ]]; then
            echo "  - Warning: Invalid port value in port file for $character" >&2
            # Do not remove the port file - we want to preserve it
            # rm -f "$port_file"
            return 1
        fi
        
        echo "  - Cleaning up port $port for $character"
        
        # Find processes using this port
        local port_pids
        port_pids=$(lsof -i:"$port" -t 2>/dev/null)
        if [ -n "$port_pids" ]; then
            for port_pid in $port_pids; do
                # Security: Validate PID is numeric
                if [[ "$port_pid" =~ ^[0-9]+$ ]]; then
                    echo "  - Killing process using port $port (PID: $port_pid)"
                    kill -9 "$port_pid" 2>/dev/null
                fi
            done
            
            # Verify port is now free
            sleep 1
            if lsof -i:"$port" -t >/dev/null 2>&1; then
                echo "  - Warning: Port $port is still in use after cleanup attempt"
            else
                echo "  - Port $port successfully freed"
            fi
        fi
        # rm -f "$port_file"
    fi
}

stop_agent() {
    local character="$1"
    local force="$2"
    
    # Security: Validate character name
    if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo "⚠️ Invalid character name format: $character" >&2
        return 1
    fi
    
    local pid_file="$LOG_DIR/${character}.pid"
    local found_process=false
    
    echo "🛑 Stopping $character..."
    
    # First try to stop by PID file
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        
        # Security: Validate PID is numeric
        if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
            echo "  - Warning: Invalid PID in PID file for $character"
            rm -f "$pid_file"
        elif ps -p "$pid" > /dev/null 2>&1; then
            echo "  - Found process with PID: $pid"
            kill_process_tree "$pid" "$force"
            
            # Wait for process to terminate
            if [ "$force" = false ]; then
                echo "  - Waiting for process to terminate gracefully..."
                for i in {1..5}; do
                    if ! ps -p "$pid" > /dev/null 2>&1; then
                        break
                    fi
                    sleep 1
                done
                
                # Force kill if still running
                if ps -p "$pid" > /dev/null 2>&1; then
                    echo "  - Process still running, force killing..."
                    kill_process_tree "$pid" true
                fi
            fi
            
            found_process=true
        else
            echo "  - PID file exists but process is not running"
        fi
        rm -f "$pid_file"
    fi
    
    # Then find and stop any processes by character name
    # Security: Use safer process detection pattern
    local char_pids
    char_pids=$(ps aux | grep -E "characters/${character}\.json" | grep -v grep | awk '{print $2}')
    
    for pid in $char_pids; do
        # Security: Validate PID is numeric
        if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
            continue
        fi
        
        echo "  - Found additional process with PID: $pid"
        kill_process_tree "$pid" "$force"
        found_process=true
    done
    
    # Clean up resources
    cleanup_agent_resources "$character"
    
    if [ "$found_process" = false ]; then
        echo "  - No running processes found for $character"
    else
        echo "  - Stopped $character successfully"
        echo "$(date +'%Y-%m-%d %H:%M:%S') - Stopped ${character}" >> "$LOG_DIR/agent_operations.log"
    fi
}

show_usage() {
    echo "Usage: $0 [options] [agent_name1 agent_name2 ...]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force kill agents"
    echo "  -c, --cleanup  Only cleanup resources without stopping agents"
    echo "  -p, --ports    Only cleanup ports (free all ports in range)"
    echo "  -s, --secure   Run with extra security checks"
    echo "Available agents:"
    for agent in "${!AGENTS[@]}"; do
        echo "  - $agent"
    done
    echo "Examples:"
    echo "  $0                           # Stop all agents"
    echo "  $0 -f                        # Force stop all agents"
    echo "  $0 bitcoin_maxi_420          # Stop specific agent"
    echo "  $0 -p                        # Cleanup all ports"
    echo "  $0 -s                        # Run with extra security checks"
}

# Process options
FORCE=false
CLEANUP_ONLY=false
PORTS_ONLY=false
SECURE_MODE=false

while [[ "${1:-}" =~ ^- ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP_ONLY=true
            shift
            ;;
        -p|--ports)
            PORTS_ONLY=true
            shift
            ;;
        -s|--secure)
            SECURE_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate requirements
command -v lsof >/dev/null 2>&1 || { echo "❌ Error: lsof is required but not installed. Please install it using 'apt-get install lsof'"; exit 1; }

# Handle ports-only cleanup mode
if [ "$PORTS_ONLY" = true ]; then
    echo "Performing port range cleanup..."
    
    # Define port range from configuration
    PORT_RANGE_START=3000
    PORT_RANGE_END=4000
    
    # Check all ports in range and free if needed
    for port in $(seq $PORT_RANGE_START $PORT_RANGE_END); do
        # Security: Validate port number
        if ! [[ "$port" =~ ^[0-9]+$ ]]; then
            continue
        fi
        
        echo "🧹 Checking port $port..."
        local port_pids
        port_pids=$(lsof -i:"$port" -t 2>/dev/null)
        if [ -n "$port_pids" ]; then
            echo "🧹 Cleaning up port $port..."
            for port_pid in $port_pids; do
                # Security: Validate PID
                if ! [[ "$port_pid" =~ ^[0-9]+$ ]]; then
                    continue
                fi
                echo "  - Killing process using port $port (PID: $port_pid)"
                kill -9 "$port_pid" 2>/dev/null
            done
        fi
    done
    
    # Security: Use find instead of glob expansion
    echo "Removing port files..."
    find "$PORT_DIR" -name "*.port" -type f -delete
    
    echo "✅ Port cleanup completed"
    exit 0
fi

# Handle cleanup only mode
if [ "$CLEANUP_ONLY" = true ]; then
    echo "Performing resource cleanup only..."
    if [ $# -eq 0 ]; then
        for character in "${!AGENTS[@]}"; do
            echo "🧹 Cleaning up resources for $character..."
            cleanup_agent_resources "$character"
        done
    else
        for character in "$@"; do
            # Security: Validate character name
            if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
                echo "⚠️ Invalid character name format: $character"
                continue
            fi
            
            if [[ -v AGENTS[$character] ]]; then
                echo "🧹 Cleaning up resources for $character..."
                cleanup_agent_resources "$character"
            else
                echo "⚠️  Unknown agent: $character"
            fi
        done
    fi
    echo "✅ Cleanup completed"
    exit 0
fi

# Security checks for secure mode
if [ "$SECURE_MODE" = true ]; then
    echo "Running in secure mode with extra checks..."
    
    # Check file permissions
    if [ -f .env ] && [ "$(stat -c %a .env)" != "600" ]; then
        echo "⚠️ Security issue: .env file has insecure permissions: $(stat -c %a .env) - should be 600"
        echo "   Fixing permissions..."
        chmod 600 .env
    fi
    
    # Check log directory permissions
    if [ -d "$LOG_DIR" ] && [ "$(stat -c %a "$LOG_DIR")" != "700" ] && [ "$(stat -c %a "$LOG_DIR")" != "750" ]; then
        echo "⚠️ Security issue: Log directory has insecure permissions: $(stat -c %a "$LOG_DIR") - should be 750"
        echo "   Fixing permissions..."
        chmod 750 "$LOG_DIR"
    fi
    
    # Check port directory permissions
    if [ -d "$PORT_DIR" ] && [ "$(stat -c %a "$PORT_DIR")" != "700" ] && [ "$(stat -c %a "$PORT_DIR")" != "750" ]; then
        echo "⚠️ Security issue: Port directory has insecure permissions: $(stat -c %a "$PORT_DIR") - should be 750"
        echo "   Fixing permissions..."
        chmod 750 "$PORT_DIR"
    fi
    
    echo "Security checks completed"
fi

# Security: Validate agent names in arguments
VALID_AGENTS=()
for character in "$@"; do
    # Validate character name format
    if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo "⚠️ Security warning: Invalid character name format: $character"
        continue
    fi
    
    # Check if agent exists
    if [[ -v AGENTS[$character] ]]; then
        VALID_AGENTS+=("$character")
    else
        echo "⚠️ Unknown agent: $character"
    fi
done

# Stop specified agents or all if none specified
if [ $# -eq 0 ]; then
    echo "Stopping all agents..."
    for character in "${!AGENTS[@]}"; do
        stop_agent "$character" $FORCE
    done
else
    for character in "${VALID_AGENTS[@]}"; do
        stop_agent "$character" $FORCE
    done
fi

echo "✅ All agents stopped"
echo "📊 View agent operations log: cat $LOG_DIR/agent_operations.log"

cleanup_agent_files() {
    local character="$1"
    
    # Security: Validate character name
    if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo "⚠️ Invalid character name format: $character" >&2
        return 1
    fi
    
    # Remove PID file and message cache
    local pid_file="${LOG_DIR}/${character}.pid"
    if [ -f "$pid_file" ]; then
        rm -f "$pid_file"
    fi
    
    # Keep the port file intact - DO NOT remove it
    # local port_file="${PORT_DIR}/${character}.port"
    # if [ -f "$port_file" ]; then
    #     rm -f "$port_file"
    # fi
}