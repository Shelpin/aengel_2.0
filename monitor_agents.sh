#!/bin/bash

# Secure bash settings
set -o nounset  # Exit when undefined variables
set -o pipefail # Properly handle pipe command failures

LOG_DIR="/root/eliza/logs"
PORT_DIR="/root/eliza/ports"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

# Agent definitions
declare -A AGENTS=(
    ["bitcoin_maxi_420"]="TELEGRAM_BOT_TOKEN_BitcoinMaxi420"
    ["eth_memelord_9000"]="TELEGRAM_BOT_TOKEN_ETHMemeLord9000"
    ["code_samurai_77"]="TELEGRAM_BOT_TOKEN_CodeSamurai77"
    ["bag_flipper_9000"]="TELEGRAM_BOT_TOKEN_BagFlipper9000"
    ["vc_shark_99"]="TELEGRAM_BOT_TOKEN_VCShark99"
    ["linda_evangelista_88"]="TELEGRAM_BOT_TOKEN_LindAEvangelista88"
)

# Secure path validation (prevent path traversal)
validate_path() {
    local path="$1"
    # Check for directory traversal attempts
    if [[ "$path" == *".."* || "$path" == *"~"* ]]; then
        echo "⚠️ Security warning: Invalid path detected" >&2
        return 1
    fi
    return 0
}

# Function to mask token for display (show first 3 and last 3 digits)
mask_token() {
    local token="$1"
    # Security: Ensure we're not displaying too much of the token
    local token_length=${#token}
    
    if [ "$token_length" -le 10 ]; then
        echo "***" # Token too short to mask meaningfully
    else
        local first_three=${token:0:3}
        local last_three=${token: -3}
        echo "${first_three}...${last_three}"
    fi
}

# Function to get runtime duration
get_runtime() {
    local pid="$1"
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "N/A"
        return
    fi
    
    local process_start
    process_start=$(ps -o lstart= -p "$pid")
    local start_seconds
    start_seconds=$(date -d "$process_start" +%s)
    local current_seconds
    current_seconds=$(date +%s)
    local runtime=$((current_seconds - start_seconds))
    
    # Format runtime
    if [ "$runtime" -lt 60 ]; then
        echo "${runtime}s"
    elif [ "$runtime" -lt 3600 ]; then
        echo "$((runtime / 60))m $((runtime % 60))s"
    else
        echo "$((runtime / 3600))h $(((runtime % 3600) / 60))m"
    fi
}

# Function to check memory usage
get_memory_usage() {
    local pid="$1"
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "N/A"
        return
    fi
    
    # Get memory usage in KB and convert to MB
    local mem_kb
    mem_kb=$(ps -o rss= -p "$pid")
    echo "$(awk "BEGIN {printf \"%.1f\", $mem_kb/1024}")MB"
}

# Function to check CPU usage
get_cpu_usage() {
    local pid="$1"
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "N/A"
        return
    fi
    
    # Get CPU usage percentage
    local cpu
    cpu=$(ps -o %cpu= -p "$pid")
    echo "${cpu}%"
}

# Function to check if port is actually in use by the agent
check_port_health() {
    local character="$1"
    local pid="$2"
    local port_file="${PORT_DIR}/${character}.port"
    
    if [ ! -f "$port_file" ]; then
        echo "${RED}No port assigned${NC}"
        return
    fi
    
    # Security: Validate content of port file
    local expected_port
    if grep -q "^PORT=" "$port_file"; then
        expected_port=$(grep "^PORT=" "$port_file" | cut -d'=' -f2 | tr -d '[:space:]')
    else
        expected_port=$(head -n 1 "$port_file" | tr -d '[:space:]')
    fi
    
    if ! [[ "$expected_port" =~ ^[0-9]+$ ]]; then
        echo "${RED}Invalid port value in port file${NC}"
        return 1
    fi
    
    # Get actual port from process - improved for Node.js processes
    local actual_port=""
    
    # Try multiple methods to find the port
    # Method 1: Direct lsof
    actual_port=$(lsof -p "$pid" -a -i tcp -sTCP:LISTEN -n -P 2>/dev/null | grep LISTEN | awk '{print $9}' | sed 's/.*://')
    
    # Method 2: Check using ss to find ports associated with process
    if [ -z "$actual_port" ]; then
        local pid_ports
        pid_ports=$(ss -tlpn | grep "$pid" | awk '{print $4}' | sed 's/.*://')
        if [ -n "$pid_ports" ]; then
            # If multiple ports, check if expected port is in the list
            if [[ "$pid_ports" == *"$expected_port"* ]]; then
                actual_port=$expected_port
            else
                # Just take the first port
                actual_port=$(echo "$pid_ports" | head -n 1)
            fi
        fi
    fi
    
    # Method 3: Check Child processes
    if [ -z "$actual_port" ]; then
        # Check if any child processes are using the port
        local child_pids
        child_pids=$(pgrep -P "$pid")
        for child_pid in $child_pids; do
            local child_port
            child_port=$(lsof -p "$child_pid" -a -i tcp -sTCP:LISTEN -n -P 2>/dev/null | grep LISTEN | awk '{print $9}' | sed 's/.*://')
            if [ -n "$child_port" ]; then
                actual_port=$child_port
                break
            fi
        done
    fi
    
    # Method 4: Check for Node.js process details
    if [ -z "$actual_port" ]; then
        # Check process command line for port argument
        local cmd_port
        cmd_port=$(ps -p "$pid" -o command= | grep -o -- "--port=[0-9]*" | cut -d= -f2)
        if [ -n "$cmd_port" ] && [ "$cmd_port" = "$expected_port" ]; then
            # The port is specified in the command line and matches expected port
            actual_port=$cmd_port
        fi
    fi
    
    if [ -z "$actual_port" ]; then
        # Check if anything is using the expected port
        local port_pid
        port_pid=$(lsof -i:"$expected_port" -t 2>/dev/null)
        if [ -n "$port_pid" ]; then
            if [[ "$port_pid" == *"$pid"* ]] || [[ "$(pgrep -P $pid)" == *"$port_pid"* ]]; then
                echo "${GREEN}Port $expected_port OK${NC}"
            else
                echo "${RED}Port $expected_port used by another process (PID: $port_pid)${NC}"
            fi
        else
            # Final fallback - check for the port mention in logs
            if grep -q "bound to.*:$expected_port" "$LOG_DIR/${character}.log" 2>/dev/null; then
                echo "${YELLOW}Port $expected_port appears in logs but not detected as active${NC}"
            else
                echo "${YELLOW}Port $expected_port not in use${NC}"
            fi
        fi
    else
        if [ "$actual_port" = "$expected_port" ]; then
            echo "${GREEN}Port $actual_port OK${NC}"
        else
            echo "${YELLOW}Port mismatch - Expected: $expected_port, Actual: $actual_port${NC}"
        fi
    fi
}

# Function to check telegram token
check_telegram_token() {
    local character="$1"
    local token_var="$2"
    
    # Source the .env file
    if [ ! -f .env ]; then
        echo "${RED}No .env file found${NC}"
        return
    fi
    
    # Security: Use a subshell to avoid leaking variables
    local masked_token
    masked_token=$(
        set -a
        # shellcheck source=/dev/null
        source .env
        set +a
        
        # Get token and mask it
        local token="${!token_var}"
        if [ -z "$token" ]; then
            echo "${RED}Token not found${NC}"
            return
        fi
        
        mask_token "$token"
    )
    
    echo "${CYAN}Token: $masked_token${NC}"
}

# Function to check for telegram bot connection
check_telegram_connection() {
    local character="$1"
    local log_file="$LOG_DIR/${character}.log"
    
    if [ ! -f "$log_file" ]; then
        echo "${RED}No log file found${NC}"
        return
    fi
    
    # Look for Telegram bot username in logs
    local bot_info
    bot_info=$(grep -m 1 "Bot username" "$log_file" | tail -n 1)
    if [ -n "$bot_info" ]; then
        echo "${GREEN}${bot_info}${NC}"
        return
    fi
    
    # Look for connection errors
    local connection_error
    connection_error=$(grep -m 1 "Error connecting to Telegram" "$log_file" | tail -n 1)
    if [ -n "$connection_error" ]; then
        echo "${RED}Connection Error: ${connection_error}${NC}"
        return
    fi
    
    echo "${YELLOW}No Telegram connection info found${NC}"
}

# Function to check relay server connection
check_relay_connection() {
    local character="$1"
    local log_file="$LOG_DIR/${character}.log"
    
    if [ ! -f "$log_file" ]; then
        echo "${RED}No log file found${NC}"
        return
    fi
    
    # Get the relay server URL and port from .env file
    local relay_url=""
    local relay_port=""
    if [ -f .env ]; then
        # Source the .env file in a subshell to avoid variable leakage
        relay_url=$(
            set -a
            # shellcheck source=/dev/null
            source .env
            set +a
            echo "${RELAY_SERVER_URL:-}"
        )
        relay_port=$(
            set -a
            # shellcheck source=/dev/null
            source .env
            set +a
            echo "${RELAY_AUTH_TOKEN:-}"
        )
    fi
    
    # Look for relay server connection in logs
    local relay_info
    relay_info=$(grep -m 1 "Connecting to relay server" "$log_file" | tail -n 1)
    
    # Look for successful registrations with relay server
    local registration_info
    registration_info=$(grep -m 1 "registered with relay server" "$log_file" | tail -n 1)
    
    # Look for heartbeats to relay server
    local recent_heartbeat
    recent_heartbeat=$(grep "Sending heartbeat to relay" "$log_file" | tail -n 1)
    local heartbeat_time=""
    if [ -n "$recent_heartbeat" ]; then
        # Extract timestamp from log entry
        heartbeat_time=$(echo "$recent_heartbeat" | grep -o "\[[0-9-]* [0-9:]*\]" | tr -d '[]')
        if [ -n "$heartbeat_time" ]; then
            # Calculate time difference
            local heartbeat_seconds
            heartbeat_seconds=$(date -d "$heartbeat_time" +%s 2>/dev/null)
            local current_seconds
            current_seconds=$(date +%s)
            local time_diff=$((current_seconds - heartbeat_seconds))
            
            if [ "$time_diff" -lt 300 ]; then # Less than 5 minutes
                registration_info="Recent heartbeat detected (${time_diff}s ago)"
            fi
        fi
    fi
    
    # Look for connection errors
    local connection_error
    connection_error=$(grep "Error connecting to relay server\|failed to register with relay" "$log_file" | tail -n 1)
    
    # Extract relay port from URL if present
    local relay_port=""
    if [[ "$relay_url" =~ :[0-9]+$ ]]; then
        relay_port=$(echo "$relay_url" | grep -o ':[0-9]*' | cut -d':' -f2)
    elif [[ "$relay_url" =~ ^http ]]; then
        # Default ports
        if [[ "$relay_url" =~ ^https ]]; then
            relay_port="443"
        else
            relay_port="80"  # Default for HTTP
        fi
    fi
    
    # Check for network connectivity to relay server
    local relay_reachable=false
    if [ -n "$relay_url" ]; then
        # Extract hostname from URL
        local relay_host
        relay_host=$(echo "$relay_url" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
        
        # Try to connect to the relay server
        if [ -n "$relay_port" ] && nc -z -w2 "$relay_host" "$relay_port" 2>/dev/null; then
            relay_reachable=true
        fi
    fi
    
    # Display connection status
    if [ -n "$registration_info" ]; then
        echo "${GREEN}Connected to relay server: $registration_info${NC}"
    elif [ -n "$relay_info" ]; then
        if [ "$relay_reachable" = true ]; then
            echo "${YELLOW}Attempted connection to relay server, status unknown${NC}"
        else
            echo "${RED}Attempted connection but relay server appears unreachable${NC}"
        fi
    elif [ -n "$connection_error" ]; then
        echo "${RED}Relay server connection error: ${connection_error}${NC}"
    else
        if [ "$relay_reachable" = true ]; then
            echo "${YELLOW}No relay server connection info found, but relay server is reachable${NC}"
        else
            echo "${RED}No relay server connection info found and server appears unreachable${NC}"
        fi
    fi
    
    # Check if the agent is registered in the relay server
    if [ -n "$relay_url" ]; then
        local health_check
        health_check=$(curl -s "${relay_url}/health" 2>/dev/null)
        if [ -n "$health_check" ]; then
            # Parse connected agents list
            if echo "$health_check" | grep -q "$character"; then
                echo "${GREEN}Agent appears in relay server's connected agents list${NC}"
            else
                echo "${YELLOW}Agent not found in relay server's connected agents list${NC}"
            fi
        fi
    fi
}

# Function to check recent agent activity
check_agent_activity() {
    local character="$1"
    local log_file="$LOG_DIR/${character}.log"
    
    if [ ! -f "$log_file" ]; then
        echo "${RED}No log file found${NC}"
        return
    fi
    
    # Count recent message events
    local interval="1 hour ago"
    local since_time
    since_time=$(date -d "$interval" +"%Y-%m-%d %H:%M:%S")
    
    # Recent messages received
    local received_count
    received_count=$(grep -c "message received" "$log_file")
    local recent_received_count
    recent_received_count=$(grep "message received" "$log_file" | grep -c -A 1 "$since_time")
    
    # Recent messages sent
    local sent_count
    sent_count=$(grep -c "sending message" "$log_file")
    local recent_sent_count
    recent_sent_count=$(grep "sending message" "$log_file" | grep -c -A 1 "$since_time")
    
    # Total commands or triggers
    local trigger_count
    trigger_count=$(grep -c -E "processing command|trigger activated|action triggered" "$log_file")
    
    # Most recent activity entry
    local last_activity
    last_activity=$(grep -E "message received|sending message|processing command|trigger activated" "$log_file" | tail -n 1)
    
    echo "${BLUE}Activity Summary:${NC}"
    echo "  - Messages received: ${received_count} total, ${recent_received_count} in last hour"
    echo "  - Messages sent: ${sent_count} total, ${recent_sent_count} in last hour"
    echo "  - Commands/triggers: ${trigger_count} total"
    
    if [ -n "$last_activity" ]; then
        echo "  - Last activity: $(echo "$last_activity" | sed 's/^.*\[/[/' | cut -c 1-100)..."
    else
        echo "  - No recent activity found"
    fi
}

# Function to check agent health
check_agent_health() {
    local character="$1"
    local token_var="$2"
    local pid_file="$LOG_DIR/${character}.pid"
    
    # Security: Validate character name to prevent injection
    if ! [[ "$character" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo "${RED}⚠️ Invalid character name format${NC}"
        return 1
    fi
    
    printf "${YELLOW}%-25s${NC}" "$character"
    
    # Check process existence
    if [ ! -f "$pid_file" ]; then
        printf "${RED}%-10s${NC}" "STOPPED"
        printf "No PID file found\n"
        return 1
    fi
    
    # Security: Validate PID file content
    local pid
    pid=$(cat "$pid_file")
    if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
        printf "${RED}%-10s${NC}" "ERROR"
        printf "Invalid PID file content\n"
        return 1
    fi
    
    if ps -p "$pid" > /dev/null 2>&1; then
        # Process running - check additional health metrics
        local runtime
        runtime=$(get_runtime "$pid")
        local memory
        memory=$(get_memory_usage "$pid")
        local cpu
        cpu=$(get_cpu_usage "$pid")
        
        printf "${GREEN}%-10s${NC}" "RUNNING"
        printf "PID: %-8s" "$pid"
        printf "Runtime: %-12s" "$runtime"
        printf "Mem: %-10s" "$memory"
        printf "CPU: %-8s" "$cpu"
        
        # Check for error patterns in recent logs
        local error_count
        error_count=$(tail -n 100 "$LOG_DIR/${character}.log" 2>/dev/null | grep -c -E "ERROR|FATAL|exception|crash")
        if [ "$error_count" -gt 0 ]; then
            printf "${RED}Errors: %d ${NC}" "$error_count"
        fi
        
        printf "\n"
        
        # Port status
        printf "%-25s%-10s" "" ""
        check_port_health "$character" "$pid"
        printf "\n"
        
        # Telegram token
        printf "%-25s%-10s" "" ""
        check_telegram_token "$character" "$token_var"
        printf "\n"
        
        # Telegram connection
        printf "%-25s%-10s" "" ""
        check_telegram_connection "$character"
        printf "\n"
        
        # Relay server connection
        printf "%-25s%-10s" "" ""
        check_relay_connection "$character"
        printf "\n"
        
        # Agent activity
        check_agent_activity "$character"
        printf "\n"
        
        return 0
    else
        # Process not running, but PID file exists
        printf "${RED}%-10s${NC}" "STOPPED"
        printf "PID file exists (PID: %s) but process is not running\n" "$pid"
        return 1
    fi
}

# Function to check relay server status
check_relay_server_status() {
    echo -e "\n${YELLOW}=== Relay Server Status ===${NC}"
    
    # Get the relay server URL and port from .env file
    local relay_url=""
    local relay_auth=""
    if [ -f .env ]; then
        # Source the .env file in a subshell to avoid variable leakage
        relay_url=$(
            set -a
            # shellcheck source=/dev/null
            source .env
            set +a
            echo "${RELAY_SERVER_URL:-}"
        )
        relay_auth=$(
            set -a
            # shellcheck source=/dev/null
            source .env
            set +a
            echo "${RELAY_AUTH_TOKEN:-}"
        )
    fi
    
    if [ -z "$relay_url" ]; then
        echo -e "${RED}❌ Relay server URL not configured in .env file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Relay Server URL:${NC} $relay_url"
    
    # Extract port from URL if present
    local relay_port=""
    if [[ "$relay_url" =~ :[0-9]+(/|$) ]]; then
        relay_port=$(echo "$relay_url" | sed -E 's/.*:([0-9]+)(\/.*)?$/\1/')
    elif [[ "$relay_url" =~ ^https?:// ]]; then
        # Default ports
        if [[ "$relay_url" =~ ^https:// ]]; then
            relay_port="443"
        else
            relay_port="80"  # Default for HTTP
        fi
    fi
    
    if [ -n "$relay_port" ]; then
        if [[ "$relay_url" =~ ^https?:// ]] && [[ ! "$relay_url" =~ :[0-9]+ ]]; then
            echo -e "${BLUE}Relay Server Port:${NC} $relay_port (default)"
        else
            echo -e "${BLUE}Relay Server Port:${NC} $relay_port"
        fi
    fi
    
    if [ -n "$relay_auth" ]; then
        echo -e "${BLUE}Authentication:${NC} $(mask_token "$relay_auth")"
    fi
    
    # Extract hostname from URL
    local relay_host=""
    if [[ "$relay_url" =~ ^https?:// ]]; then
        relay_host=$(echo "$relay_url" | sed -E 's|^https?://([^:/]+)(:[0-9]+)?(\/.*)?$|\1|')
    else
        relay_host="$relay_url"  # Assume it's just a hostname
    fi
    
    # If it's localhost, also check 127.0.0.1
    local is_localhost=false
    if [[ "$relay_host" == "localhost" ]]; then
        is_localhost=true
    fi
    
    # Check if the relay server is running
    if [ -n "$relay_host" ]; then
        if [ -n "$relay_port" ] && (nc -z -w2 "$relay_host" "$relay_port" 2>/dev/null || ($is_localhost && nc -z -w2 "127.0.0.1" "$relay_port" 2>/dev/null)); then
            echo -e "${GREEN}✅ Relay server is reachable${NC}"
            
            # Try to get health information
            local health_check
            health_check=$(curl -s "${relay_url}/health" 2>/dev/null)
            if [ -n "$health_check" ]; then
                # Extract information from health check response
                local uptime
                uptime=$(echo "$health_check" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
                local agent_count
                agent_count=$(echo "$health_check" | grep -o '"agents":[0-9]*' | cut -d':' -f2)
                local agents_list
                agents_list=$(echo "$health_check" | grep -o '"agents_list":"[^"]*"' | cut -d':' -f2 | tr -d '"')
                
                if [ -n "$uptime" ]; then
                    # Format uptime nicely without bc
                    if [ "${uptime%.*}" -lt 60 ]; then
                        echo -e "${BLUE}Uptime:${NC} ${uptime} seconds"
                    elif [ "${uptime%.*}" -lt 3600 ]; then
                        # Minutes calculation without bc
                        local minutes=$((${uptime%.*} / 60))
                        echo -e "${BLUE}Uptime:${NC} $minutes minutes"
                    else
                        # Hours calculation without bc
                        local hours=$((${uptime%.*} / 3600))
                        echo -e "${BLUE}Uptime:${NC} $hours hours"
                    fi
                fi
                
                if [ -n "$agent_count" ]; then
                    echo -e "${BLUE}Connected Agents:${NC} $agent_count"
                    if [ -n "$agents_list" ]; then
                        echo -e "${BLUE}Agent List:${NC} $agents_list"
                    fi
                fi
                
                # Check for any process running the relay server
                local relay_pid
                relay_pid=$(pgrep -f "node.*relay-server" | head -1)
                if [ -n "$relay_pid" ]; then
                    local relay_memory
                    relay_memory=$(ps -o rss= -p "$relay_pid" | awk '{printf "%.1f", $1/1024}')
                    local relay_cpu
                    relay_cpu=$(ps -o %cpu= -p "$relay_pid")
                    echo -e "${BLUE}Server Process:${NC} PID: $relay_pid, Memory: ${relay_memory}MB, CPU: ${relay_cpu}%"
                fi
            else
                echo -e "${YELLOW}⚠️ Relay server is reachable but health check failed${NC}"
            fi
        else
            echo -e "${RED}❌ Relay server is not reachable${NC}"
            
            # Check if the relay server process is running locally
            local relay_pid
            relay_pid=$(pgrep -f "node.*relay-server" | head -1)
            if [ -n "$relay_pid" ]; then
                echo -e "${YELLOW}⚠️ Relay server process is running (PID: $relay_pid) but not responding${NC}"
                echo -e "${GRAY}  Recommended fix: Restart the relay server with './relay-server/start-relay.sh'${NC}"
            else
                echo -e "${RED}❌ No relay server process found${NC}"
                echo -e "${GRAY}  Recommended fix: Start the relay server with './relay-server/start-relay.sh'${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Could not determine relay server hostname from URL${NC}"
    fi
}

# Function to generate system status
show_system_status() {
    echo -e "\n${YELLOW}=== System Resource Usage ===${NC}"
    
    # Overall system load
    echo -e "${BLUE}Load Average:${NC} $(uptime | awk -F'load average: ' '{print $2}')"
    
    # Memory usage
    local mem_total
    mem_total=$(free -m | awk '/Mem:/ {print $2}')
    local mem_used
    mem_used=$(free -m | awk '/Mem:/ {print $3}')
    local mem_percent=$((mem_used * 100 / mem_total))
    echo -e "${BLUE}Memory:${NC} ${mem_used}MB / ${mem_total}MB (${mem_percent}%)"
    
    # Disk usage
    local disk_usage
    disk_usage=$(df -h . | awk 'NR==2 {print $5 " used, " $4 " free"}')
    echo -e "${BLUE}Disk:${NC} ${disk_usage}"
    
    # Network connections
    local telegram_connections
    telegram_connections=$(netstat -an | grep -c "443")
    echo -e "${BLUE}Telegram Connections:${NC} ${telegram_connections}"
    
    # Agent ports in use
    echo -e "${BLUE}Agent Ports:${NC}"
    for character in "${!AGENTS[@]}"; do
        local port_file="${PORT_DIR}/${character}.port"
        if [ -f "$port_file" ]; then
            local port
            if grep -q "^PORT=" "$port_file"; then
                port=$(grep "^PORT=" "$port_file" | cut -d'=' -f2 | tr -d '[:space:]')
            else
                port=$(head -n 1 "$port_file" | tr -d '[:space:]')
            fi
            
            # Security: Validate port number
            if ! [[ "$port" =~ ^[0-9]+$ ]]; then
                echo -e "  - ${character}: ${RED}Invalid port value${NC}"
                continue
            fi
            
            local port_pid
            port_pid=$(lsof -i:"$port" -t 2>/dev/null)
            if [ -n "$port_pid" ]; then
                echo -e "  - ${character}: Port ${port} in use by PID ${port_pid}"
            else
                echo -e "  - ${character}: Port ${port} not in use"
            fi
        else
            echo -e "  - ${character}: No port assigned"
        fi
    done
    
    # Check relay server status
    check_relay_server_status
}

# Function to watch logs in real-time for multiple agents
watch_logs() {
    local characters=("$@")
    local show_errors="$SHOW_ERRORS"
    local activity_only="$ACTIVITY_ONLY"
    local current_agent=""
    
    if [ ${#characters[@]} -eq 0 ]; then
        # If no specific agents requested, watch all agents
        for character in "${!AGENTS[@]}"; do
            characters+=("$character")
        done
    fi
    
    if [ ${#characters[@]} -eq 0 ]; then
        echo "No agents available to monitor"
        return 1
    fi
    
    # Check if all log files exist
    local missing_logs=false
    local log_files=()
    
    for character in "${characters[@]}"; do
        local log_file="$LOG_DIR/${character}.log"
        
        # Security: Validate character name to prevent path traversal
        if ! validate_path "$character"; then
            echo "⚠️ Invalid character name: $character"
            continue
        fi
        
        if [ ! -f "$log_file" ]; then
            echo "❌ Error: Log file not found for $character: $log_file"
            missing_logs=true
        else
            log_files+=("$log_file")
        fi
    done
    
    if [ "$missing_logs" = true ] && [ ${#log_files[@]} -eq 0 ]; then
        echo "No valid log files found for monitoring"
        return 1
    fi
    
    # Build filter pattern based on options
    local filter_pattern=""
    if [ "$activity_only" = true ]; then
        filter_pattern="message received|sending message|processing command|trigger activated|action triggered|Bot username|ERROR|FATAL|exception|crash"
    elif [ "$show_errors" = true ]; then
        filter_pattern="ERROR|FATAL|exception|crash"
    fi
    
    echo "📊 Watching logs for: ${characters[*]}"
    echo "📊 Press Ctrl+C to stop watching"
    
    # Unbuffer output to ensure real-time display
    export PYTHONUNBUFFERED=1
    
    if [ ${#log_files[@]} -eq 1 ]; then
        # Single agent monitoring
        if [ -n "$filter_pattern" ]; then
            tail -f "${log_files[0]}" | grep --line-buffered --color=always -E "$filter_pattern|$"
        else
            tail -f "${log_files[0]}"
        fi
    else
        # Multi-agent monitoring - use a simpler approach with just one tail command
        # This is more efficient and avoids pipeline buffering issues
        
        # Convert log files array to space-separated string for tail command
        local log_files_str=$(printf " %s" "${log_files[@]}")
        log_files_str=${log_files_str:1}  # Remove leading space
        
        if [ -n "$filter_pattern" ]; then
            # Process with grep if filter pattern exists
            tail -f $log_files_str | grep --line-buffered --color=always -E "$filter_pattern|$" | 
            while IFS= read -r line; do
                # Extract the filename from the prefix added by tail
                local file=$(echo "$line" | grep -o "==> .*\.log <==" | sed 's/==> //;s/ <==//')
                if [[ "$file" == *".log" ]]; then
                    # Extract agent name from filename
                    local agent=$(basename "$file" .log)
                    # Print with agent name as prefix
                    echo -e "${BOLD}[$agent]${NC} $(echo "$line" | sed 's/==> .*\.log <==//g')"
                else
                    # Print line with the last known agent prefix
                    echo "$line"
                fi
            done
        else
            # Use tail -f with filename headers and process each line to add agent prefixes
            tail -f -v $log_files_str | 
            while IFS= read -r line; do
                # Extract the filename from the prefix added by tail
                local file=$(echo "$line" | grep -o "==> .*\.log <==" | sed 's/==> //;s/ <==//')
                if [[ "$file" == *".log" ]]; then
                    # Extract agent name from filename
                    local agent=$(basename "$file" .log)
                    # Print with agent name as prefix (but no content yet)
                    current_agent="$agent"
                    continue
                else
                    # Print line with agent prefix
                    echo -e "${BOLD}[$current_agent]${NC} $line"
                fi
            done
        fi
    fi
}

# Function to analyze security risks in the agent setup
security_check() {
    echo -e "\n${YELLOW}=== Security Checks ===${NC}"
    local issues_found=0
    
    # Check directory and file permissions
    echo -e "\n${BLUE}Checking file permissions:${NC}"
    
    # Ensure .env file is not readable by others
    if [ -f .env ] && [ "$(stat -c %a .env)" != "600" ]; then
        echo -e "  ${RED}⚠️ .env file has insecure permissions: $(stat -c %a .env) - should be 600${NC}"
        echo -e "  ${GRAY}  Recommended fix: chmod 600 .env${NC}"
        ((issues_found++))
    else
        echo -e "  ${GREEN}✓ .env file permissions are secure${NC}"
    fi
    
    # Check log directory permissions
    if [ -d "$LOG_DIR" ] && [ "$(stat -c %a "$LOG_DIR")" != "700" ] && [ "$(stat -c %a "$LOG_DIR")" != "750" ]; then
        echo -e "  ${YELLOW}⚠️ Log directory has potentially insecure permissions: $(stat -c %a "$LOG_DIR")${NC}"
        echo -e "  ${GRAY}  Recommended fix: chmod 750 $LOG_DIR${NC}"
        ((issues_found++))
    else
        echo -e "  ${GREEN}✓ Log directory permissions are secure${NC}"
    fi
    
    # Check port directory permissions
    if [ -d "$PORT_DIR" ] && [ "$(stat -c %a "$PORT_DIR")" != "700" ] && [ "$(stat -c %a "$PORT_DIR")" != "750" ]; then
        echo -e "  ${YELLOW}⚠️ Port directory has potentially insecure permissions: $(stat -c %a "$PORT_DIR")${NC}"
        echo -e "  ${GRAY}  Recommended fix: chmod 750 $PORT_DIR${NC}"
        ((issues_found++))
    else
        echo -e "  ${GREEN}✓ Port directory permissions are secure${NC}"
    fi
    
    # Check for exposed tokens in logs
    echo -e "\n${BLUE}Checking for exposed tokens:${NC}"
    local exposed_tokens
    exposed_tokens=$(grep -r -E 'token|Token|TOKEN' "$LOG_DIR" --include="*.log" | grep -v "Using token variable" | wc -l)
    
    if [ "$exposed_tokens" -gt 0 ]; then
        echo -e "  ${RED}⚠️ Potential token exposure in logs: $exposed_tokens matches${NC}"
        echo -e "  ${GRAY}  Recommended fix: Review log files and implement better token masking${NC}"
        ((issues_found++))
    else
        echo -e "  ${GREEN}✓ No obvious token exposure in logs${NC}"
    fi
    
    # Check for running processes with same ports
    echo -e "\n${BLUE}Checking for port conflicts:${NC}"
    local port_conflicts=0
    
    for character in "${!AGENTS[@]}"; do
        local port_file="${PORT_DIR}/${character}.port"
        if [ -f "$port_file" ]; then
            local port
            port=$(cat "$port_file")
            if [[ "$port" =~ ^[0-9]+$ ]]; then
                local port_pids
                port_pids=$(lsof -i:"$port" -t 2>/dev/null | wc -l)
                if [ "$port_pids" -gt 1 ]; then
                    echo -e "  ${RED}⚠️ Port conflict on $port for $character - multiple processes using this port${NC}"
                    ((port_conflicts++))
                fi
            fi
        fi
    done
    
    if [ "$port_conflicts" -eq 0 ]; then
        echo -e "  ${GREEN}✓ No port conflicts detected${NC}"
    else
        echo -e "  ${GRAY}  Recommended fix: Run './stop_agents.sh -p' to clean up ports${NC}"
        ((issues_found++))
    fi
    
    # Summary
    echo -e "\n${BLUE}Security check summary:${NC}"
    if [ "$issues_found" -eq 0 ]; then
        echo -e "  ${GREEN}✓ No security issues found${NC}"
    else
        echo -e "  ${RED}⚠️ $issues_found potential security issues found${NC}"
        echo -e "  ${GRAY}  Review the recommendations above${NC}"
    fi
}

show_usage() {
    echo "Usage: $0 [options] [agent_name1 agent_name2 ...]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -l, --logs     Show recent logs"
    echo "  -e, --errors   Show only error logs"
    echo "  -s, --system   Show system status"
    echo "  -w, --watch    Watch logs in real-time (for all if no agent specified)"
    echo "  -a, --activity Watch only activity-related logs (messages, commands, etc.)"
    echo "  -S, --security Perform security checks on the setup"
    echo "  -r, --relay    Check relay server status"
    echo "Available agents:"
    for agent in "${!AGENTS[@]}"; do
        echo "  - $agent"
    done
    echo "Examples:"
    echo "  $0                          # Check status of all agents"
    echo "  $0 bitcoin_maxi_420        # Check status of only BitcoinMaxi"
    echo "  $0 -l -e                   # Show error logs for all agents"
    echo "  $0 -w                      # Watch logs for all agents in real-time"
    echo "  $0 -w -a bitcoin_maxi_420  # Watch only activity logs for BitcoinMaxi"
    echo "  $0 -S                      # Perform security checks"
    echo "  $0 -r                      # Check relay server status"
}

# Process options
SHOW_LOGS=false
SHOW_ERRORS=false
SHOW_SYSTEM=false
SECURITY_CHECK=false
WATCH_LOGS=false
ACTIVITY_ONLY=false
CHECK_RELAY=false
WATCH_AGENTS=()

while [[ "${1:-}" =~ ^- ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -e|--errors)
            SHOW_ERRORS=true
            shift
            ;;
        -s|--system)
            SHOW_SYSTEM=true
            shift
            ;;
        -S|--security)
            SECURITY_CHECK=true
            shift
            ;;
        -a|--activity)
            ACTIVITY_ONLY=true
            shift
            ;;
        -r|--relay)
            CHECK_RELAY=true
            shift
            ;;
        -w|--watch)
            WATCH_LOGS=true
            shift
            # Collect any non-option arguments as agent names
            while [[ "${1:-}" != "" && ! "${1:-}" =~ ^- ]]; do
                WATCH_AGENTS+=("$1")
                shift
            done
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Security: Validate and sanitize any remaining arguments (agent names)
AGENT_NAMES=()
while [[ "${1:-}" != "" ]]; do
    # Validate agent name format to prevent injection
    if [[ "$1" =~ ^[a-zA-Z0-9_]+$ ]]; then
        AGENT_NAMES+=("$1")
    else
        echo "⚠️ Invalid agent name format: $1"
    fi
    shift
done

# Validate requirements
command -v lsof >/dev/null 2>&1 || { echo "❌ Error: lsof is required but not installed. Please install it using 'apt-get install lsof'"; exit 1; }

# Security check mode
if [ "$SECURITY_CHECK" = true ]; then
    security_check
    exit 0
fi

# Check relay server only mode
if [ "$CHECK_RELAY" = true ]; then
    check_relay_server_status
    exit 0
fi

# Handle watch logs mode
if [ "$WATCH_LOGS" = true ]; then
    # If specific agents were provided for watching
    if [ ${#WATCH_AGENTS[@]} -gt 0 ]; then
        watch_logs "${WATCH_AGENTS[@]}"
    # Otherwise watch all agents
    else
        watch_logs "${AGENT_NAMES[@]}"
    fi
    exit 0
fi

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Error: Log directory not found: $LOG_DIR"
    mkdir -p "$LOG_DIR"
    echo "✅ Created log directory: $LOG_DIR"
fi

# Monitor specified agents or all if none specified
echo -e "${YELLOW}=== Agent Status [$(date)] ===${NC}"
echo

if [ ${#AGENT_NAMES[@]} -eq 0 ]; then
    total_agents=${#AGENTS[@]}
    running_agents=0
    
    for character in "${!AGENTS[@]}"; do
        if check_agent_health "$character" "${AGENTS[$character]}"; then
            ((running_agents++))
        fi
        echo
    done
    
    echo -e "${YELLOW}Summary:${NC} $running_agents/$total_agents agents running"
else
    for character in "${AGENT_NAMES[@]}"; do
        if [[ -v AGENTS[$character] ]]; then
            check_agent_health "$character" "${AGENTS[$character]}"
            echo
        else
            echo -e "${RED}⚠️  Unknown agent:${NC} $character"
            show_usage
        fi
    done
fi

# Show system status if requested
if [ "$SHOW_SYSTEM" = true ]; then
    show_system_status
fi

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
    echo -e "\n${YELLOW}=== Recent Log Entries ===${NC}"
    for character in "${!AGENTS[@]}"; do
        if [ ${#AGENT_NAMES[@]} -eq 0 ] || [[ " ${AGENT_NAMES[*]} " =~ " $character " ]]; then
            echo -e "\n${BLUE}=== $character ===${NC}"
            if [ "$SHOW_ERRORS" = true ]; then
                grep -E "ERROR|FATAL|exception|crash" "$LOG_DIR/${character}.log" 2>/dev/null | tail -n 10 || echo "No error logs found"
            elif [ "$ACTIVITY_ONLY" = true ]; then
                grep -E "message received|sending message|processing command|trigger activated|Bot username" "$LOG_DIR/${character}.log" 2>/dev/null | tail -n 10 || echo "No activity logs found"
            else
                tail -n 10 "$LOG_DIR/${character}.log" 2>/dev/null || echo "No logs found"
            fi
        fi
    done
fi

echo -e "\n${YELLOW}=== Tips ===${NC}"
echo "- View all logs in real-time: $0 -w"
echo "- View activity logs: $0 -w -a"
echo "- View logs for specific agent: $0 -w bitcoin_maxi_420"
echo "- View error logs: $0 -e -l"
echo "- View system status: $0 -s"
echo "- Check relay server status: $0 -r"
echo "- Check security: $0 -S"
echo "- Stop agents: ./stop_agents.sh"
echo "- Restart agents: ./stop_agents.sh && ./start_agents.sh"
echo "- Cleanup ports: ./stop_agents.sh --ports"
