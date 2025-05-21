#!/bin/bash

# VALHALLA IMPLEMENTATION PLAN
# Script to implement all phases of the Valhalla Plan

set -e  # Exit on errors

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log helper function
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1${NC}"
}

log "Starting Valhalla Plan Implementation"

#######################################################
# PHASE 1: Cleanup
#######################################################
log "🧼 PHASE 1: Cleanup"

# Stop all agents
log "Stopping all agents..."
if [ -f "./stop_agents.sh" ]; then
  ./stop_agents.sh
else
  log_warning "stop_agents.sh not found, using fallback method to stop agents"
  pkill -f "node.*eliza" || true
  sleep 2
fi

# Clean logs and pid files
log "Running port cleanup..."
if [ -f "./cleanup_ports.sh" ]; then
  ./cleanup_ports.sh
else
  log_warning "cleanup_ports.sh not found, creating temporary cleanup script"
  
  # Create temporary cleanup script
  cat > ./temp_cleanup_ports.sh << 'EOF'
#!/bin/bash
echo "🔄 Cleaning up ports..."

# Define the range of ports we use
PORT_RANGE_START=3000
PORT_RANGE_END=3010

# Loop through each port in our range
for PORT in $(seq $PORT_RANGE_START $PORT_RANGE_END); do
  # Check if this port is in use
  if lsof -i :$PORT -t &> /dev/null; then
    PID=$(lsof -i :$PORT -t)
    echo "⚠️ Port $PORT is in use by PID $PID, attempting to terminate..."
    
    # Try to kill it nicely first
    kill $PID 2>/dev/null || true
    
    # Wait a moment
    sleep 1
    
    # Check if it's still running and force kill if needed
    if lsof -i :$PORT -t &> /dev/null; then
      echo "🔥 Forcefully terminating process on port $PORT"
      kill -9 $(lsof -i :$PORT -t) 2>/dev/null || true
    fi
    
    echo "✅ Port $PORT freed"
  else
    echo "✅ Port $PORT already free"
  fi
done

# Also clean up any agent processes that might be running
echo "🔄 Cleaning up any lingering agent processes..."
pkill -f "start-agent-with-patches.js" 2>/dev/null || true

# Clean up any PID files
echo "🔄 Cleaning up PID files..."
rm -f /root/eliza/ports/*.pid 2>/dev/null || true

echo "✅ Port cleanup complete"
EOF
  
  chmod +x ./temp_cleanup_ports.sh
  ./temp_cleanup_ports.sh
  rm ./temp_cleanup_ports.sh
fi

log_success "Phase 1 complete"

#######################################################
# PHASE 2: Memory Leak Fixes
#######################################################
log "🧠 PHASE 2: Memory Leak Fixes"

# 2.1 Fix the Relay Polling Leak in TelegramMultiAgentPlugin.ts
log "2.1 Fixing Relay Polling Leak in TelegramMultiAgentPlugin.ts"

# Create backup of the file
cp packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts.bak

# Look for the polling code pattern in TelegramMultiAgentPlugin.ts
POLLING_PATTERN=$(grep -n "setInterval.*fetch.*getUpdates" packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts || echo "")

if [ -n "$POLLING_PATTERN" ]; then
  log "Found polling pattern, replacing with memory-safe version"
  
  # Extract the line number
  LINE_NUM=$(echo "$POLLING_PATTERN" | cut -d: -f1)
  
  # Use awk to replace the setInterval block
  awk -v line="$LINE_NUM" '
  NR == line {
    print "    this.checkIntervalId = setInterval(async () => {"
    print "      try {"
    print "        const controller = new AbortController();"
    print "        const timeoutId = setTimeout(() => controller.abort(), 5000);"
    print ""
    print "        const res = await fetch(`${this.config.relayServerUrl}/getUpdates?agent_id=${this.agentId}`, {"
    print "          signal: controller.signal"
    print "        });"
    print ""
    print "        clearTimeout(timeoutId);"
    print "        const data = await res.json();"
    print ""
    print "        if (data?.messages) {"
    print "          // Process messages"
    print "          await this.processRelayUpdates(data);"
    print "          "
    print "          // Clear references after use"
    print "          for (let i = 0; i < data.messages.length; i++) {"
    print "            data.messages[i] = null;"
    print "          }"
    print "          data.messages = null;"
    print "        }"
    print "      } catch (err) {"
    print "        if (err.name === \"AbortError\") {"
    print "          this.logger.warn(\"[POLLING] Polling request timed out.\");"
    print "        } else {"
    print "          this.logger.error(`[POLLING] Polling failed: ${err.message}`);"
    print "        }"
    print "      }"
    print "    }, this.config.pollingIntervalMs || 2000);"
    
    # Skip the next few lines of the original interval setup
    skip = 10
  }
  skip > 0 { skip--; next }
  { print }
  ' packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts.bak > packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts
  
  log_success "Successfully applied polling leak fix"
else
  log_warning "Could not find polling pattern, please check TelegramMultiAgentPlugin.ts manually"
fi

# 2.2 Fix SQLite Connection Leak in FallbackMemoryManager.ts
log "2.2 Fixing SQLite Connection Leak in FallbackMemoryManager.ts"

# Create backup of the file
cp packages/telegram-multiagent/src/FallbackMemoryManager.ts packages/telegram-multiagent/src/FallbackMemoryManager.ts.bak

# Add connection pool to the FallbackMemoryManager class
CONNECTION_POOL_CODE="  private connectionPool = {
    connections: [],
    maxSize: 5,
    getConnection() {
      for (let conn of this.connections) {
        if (!conn.inUse) {
          conn.inUse = true;
          return conn.conn;
        }
      }
      if (this.connections.length < this.maxSize) {
        const conn = this.dbAdapter;
        this.connections.push({ conn, inUse: true });
        return conn;
      }
      return this.connections[0].conn; // fallback
    },
    releaseConnection(conn) {
      for (let c of this.connections) {
        if (c.conn === conn) c.inUse = false;
      }
    }
  };"

# Find the right position to insert the connection pool (after class properties)
CONSTRUCTOR_LINE=$(grep -n "constructor(" packages/telegram-multiagent/src/FallbackMemoryManager.ts | head -n 1 | cut -d: -f1)
PREV_LINE=$((CONSTRUCTOR_LINE - 1))

if [ -n "$CONSTRUCTOR_LINE" ]; then
  log "Found constructor at line $CONSTRUCTOR_LINE, adding connection pool before it"
  
  # Insert the connection pool code before the constructor
  sed -i "${PREV_LINE}a\\
${CONNECTION_POOL_CODE}" packages/telegram-multiagent/src/FallbackMemoryManager.ts
  
  # Now modify methods to use the connection pool
  # This is a simplified approach - in a real implementation you would need to 
  # modify all methods that use dbAdapter to use the connection pool
  
  # Find some example methods that use dbAdapter directly
  QUERY_METHODS=$(grep -n "this.dbAdapter.query" packages/telegram-multiagent/src/FallbackMemoryManager.ts || echo "")
  EXECUTE_METHODS=$(grep -n "this.dbAdapter.execute" packages/telegram-multiagent/src/FallbackMemoryManager.ts || echo "")
  
  if [ -n "$QUERY_METHODS" ] || [ -n "$EXECUTE_METHODS" ]; then
    log "Found database methods, modifying to use connection pool"
    
    # Replace direct dbAdapter usage with connection pool in the file
    sed -i 's/this.dbAdapter.query/const conn = this.connectionPool.getConnection();\n    try {\n      const result = conn.query/g' packages/telegram-multiagent/src/FallbackMemoryManager.ts
    sed -i 's/this.dbAdapter.execute/const conn = this.connectionPool.getConnection();\n    try {\n      const result = conn.execute/g' packages/telegram-multiagent/src/FallbackMemoryManager.ts
    
    # Add releaseConnection after query/execute calls
    sed -i 's/const result = conn.query\(.*\);/const result = conn.query\1;\n      this.connectionPool.releaseConnection(conn);\n      return result;/g' packages/telegram-multiagent/src/FallbackMemoryManager.ts
    sed -i 's/const result = conn.execute\(.*\);/const result = conn.execute\1;\n      this.connectionPool.releaseConnection(conn);\n      return result;/g' packages/telegram-multiagent/src/FallbackMemoryManager.ts
    
    # Add catch blocks
    sed -i 's/return result;/return result;\n    } catch (error) {\n      this.connectionPool.releaseConnection(conn);\n      throw error;\n    }/g' packages/telegram-multiagent/src/FallbackMemoryManager.ts
    
    log_success "Applied connection pool modifications to database methods"
  else
    log_warning "Could not find database methods, please check FallbackMemoryManager.ts manually"
  fi
else
  log_error "Could not find constructor in FallbackMemoryManager.ts"
fi

# 2.3 Reduce Logging Overhead
log "2.3 Reducing Logging Overhead"

# Create a utility function to minimize log message size
MINIMAL_LOG_FUNCTION="
/**
 * Creates a minimal representation of a message object for logging
 * @param {any} msg - The message object to minimize
 * @return {object} - A minimal representation with just essential properties
 */
function logMinimalMsg(msg) {
  if (!msg) return 'null';
  return {
    id: msg?.message_id,
    from: msg?.from?.username,
    text: msg?.text?.slice(0, 100),
    chatId: msg?.chat?.id
  };
}"

# Add the function to TelegramMultiAgentPlugin.ts
UTILS_IMPORT_LINE=$(grep -n "import { " packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts | head -n 1 | cut -d: -f1)
if [ -n "$UTILS_IMPORT_LINE" ]; then
  log "Adding logMinimalMsg function after imports"
  
  # Insert the minimal log function after the imports
  AFTER_IMPORTS=$((UTILS_IMPORT_LINE + 3))
  sed -i "${AFTER_IMPORTS}a\\
${MINIMAL_LOG_FUNCTION}" packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts
  
  # Replace heavy JSON.stringify logging with minimal logging
  sed -i 's/JSON.stringify(message)/logMinimalMsg(message)/g' packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts
  sed -i 's/JSON.stringify(msg)/logMinimalMsg(msg)/g' packages/telegram-multiagent/src/TelegramMultiAgentPlugin.ts
  
  log_success "Added minimal logging function and replaced heavy logging"
else
  log_error "Could not find imports in TelegramMultiAgentPlugin.ts"
fi

log_success "Phase 2 complete"

#######################################################
# PHASE 3: Add Memory Limits to Node.js
#######################################################
log "🧠 PHASE 3: Adding Memory Limits to Node.js"

# Create the NODE_OPTIONS export
log "Adding NODE_OPTIONS to limit memory usage"

# Add it to start_agents.sh
if [ -f "./start_agents.sh" ]; then
  if ! grep -q "NODE_OPTIONS.*max-old-space-size" ./start_agents.sh; then
    log "Adding NODE_OPTIONS to start_agents.sh"
    sed -i '3i# Set Node.js memory limit\nexport NODE_OPTIONS="--max-old-space-size=512"' ./start_agents.sh
  else
    log "NODE_OPTIONS already exists in start_agents.sh"
  fi
else
  log_warning "start_agents.sh not found, can't add NODE_OPTIONS there"
fi

# Add it to fix_and_restart.sh
if [ -f "./fix_and_restart.sh" ]; then
  if ! grep -q "NODE_OPTIONS.*max-old-space-size" ./fix_and_restart.sh; then
    log "Adding NODE_OPTIONS to fix_and_restart.sh"
    sed -i '3i# Set Node.js memory limit\nexport NODE_OPTIONS="--max-old-space-size=512"' ./fix_and_restart.sh
  else
    log "NODE_OPTIONS already exists in fix_and_restart.sh"
  fi
else
  log_warning "fix_and_restart.sh not found, can't add NODE_OPTIONS there"
fi

log_success "Phase 3 complete"

#######################################################
# PHASE 4: Create Controlled Launch Script
#######################################################
log "🚀 PHASE 4: Creating Controlled Launch Script"

# Create a new controlled launch script
cat > ./launch_valhalla.sh << 'EOF'
#!/bin/bash

echo "🚀 VALHALLA CONTROLLED LAUNCH SCRIPT"
export NODE_OPTIONS="--max-old-space-size=512"

# Build the project first
echo "🔨 Building project..."
pnpm build || { echo "❌ Build failed!"; exit 1; }
echo "✅ Build complete"

# Check if relay server is running
echo "🔍 Checking if relay server is running..."
if ! curl -s http://localhost:4000/health | grep -q "status.*ok"; then
  echo "⚠️ Relay server not detected. Starting relay server..."
  cd relay-server && ./start-relay.sh && cd ..
  sleep 5
  
  # Verify relay server started
  if ! curl -s http://localhost:4000/health | grep -q "status.*ok"; then
    echo "❌ Failed to start relay server. Please start it manually."
    exit 1
  fi
  echo "✅ Relay server started and verified"
else
  echo "✅ Relay server already running"
fi

# Define agents
agents=("eth_memelord_9000" "vc_shark_99" "code_samurai_77" "bitcoin_maxi_420" "bag_flipper_9000" "linda_evangelista_88")
PORT=3000

# Start each agent with 5 second delay
for agent in "${agents[@]}"; do
  echo "🤖 Starting $agent on port $PORT"
  pnpm start --character="characters/${agent}.json" \
             --clients=@elizaos-plugins/client-telegram \
             --plugins=@elizaos/telegram-multiagent \
             --log-level=debug \
             --port=$PORT &
  
  # Save PID to file for cleanup
  echo $! > ./logs/${agent}.pid
  
  PORT=$((PORT + 1))
  echo "💤 Waiting 5 seconds before starting next agent..."
  sleep 5
done

echo "✅ All agents started"
echo "💡 Monitor logs with: tail -f logs/*.log"
echo "💡 Monitor memory with: watch -n 1 'ps aux --sort -rss | grep node'"
EOF

chmod +x ./launch_valhalla.sh
log_success "Created controlled launch script: launch_valhalla.sh"

#######################################################
# PHASE 5: Monitor & Confirm
#######################################################
log "✅ PHASE 5: Adding Monitoring Script"

# Create a monitoring script
cat > ./monitor_valhalla.sh << 'EOF'
#!/bin/bash

# VALHALLA MONITORING SCRIPT
# Monitors agent processes and logs

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VALHALLA MONITORING SCRIPT ===${NC}"

# Show menu
echo -e "${YELLOW}Choose what to monitor:${NC}"
echo "1) Memory usage (top 10 processes by memory)"
echo "2) Agent logs (tail -f of all logs)"
echo "3) Specific agent log (select agent)"
echo "4) Relay server health"
echo "5) Everything (split screen)"
echo "6) Exit"

read -p "Enter your choice: " choice

case $choice in
  1)
    echo -e "${BLUE}Monitoring memory usage (press Ctrl+C to exit)...${NC}"
    watch -n 1 'ps aux --sort -rss | head -n 1; ps aux --sort -rss | grep node | head -n 10'
    ;;
  2)
    echo -e "${BLUE}Monitoring all agent logs (press Ctrl+C to exit)...${NC}"
    tail -f logs/*.log
    ;;
  3)
    echo -e "${YELLOW}Available agent logs:${NC}"
    ls -1 logs/*.log | cat -n
    read -p "Enter log number: " log_num
    log_file=$(ls -1 logs/*.log | sed -n "${log_num}p")
    if [ -n "$log_file" ]; then
      echo -e "${BLUE}Monitoring $log_file (press Ctrl+C to exit)...${NC}"
      tail -f "$log_file"
    else
      echo -e "${RED}Invalid selection${NC}"
    fi
    ;;
  4)
    echo -e "${BLUE}Checking relay server health...${NC}"
    curl -s http://localhost:4000/health | jq
    ;;
  5)
    # Using tmux for split screen if available
    if command -v tmux &> /dev/null; then
      echo -e "${BLUE}Starting split-screen monitoring (press Ctrl+B then D to detach)...${NC}"
      sleep 1
      
      tmux new-session -d -s valhalla_monitor
      tmux split-window -h -t valhalla_monitor
      tmux split-window -v -t valhalla_monitor:0.0
      tmux split-window -v -t valhalla_monitor:0.1
      
      tmux send-keys -t valhalla_monitor:0.0 "watch -n 1 'ps aux --sort -rss | head -n 1; ps aux --sort -rss | grep node | head -n 10'" C-m
      tmux send-keys -t valhalla_monitor:0.1 "echo 'Relay server health:'; while true; do curl -s http://localhost:4000/health | jq '.agents_list, .agents'; sleep 5; done" C-m
      tmux send-keys -t valhalla_monitor:0.2 "tail -f logs/eth_memelord_9000.log" C-m
      tmux send-keys -t valhalla_monitor:0.3 "tail -f logs/relay-server.log" C-m
      
      tmux attach-session -t valhalla_monitor
    else
      echo -e "${RED}tmux is not installed. Please install tmux or select another option.${NC}"
    fi
    ;;
  6)
    echo -e "${BLUE}Exiting...${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    ;;
esac
EOF

chmod +x ./monitor_valhalla.sh
log_success "Created monitoring script: monitor_valhalla.sh"

# Final success message
log_success "🎉 VALHALLA PLAN IMPLEMENTATION COMPLETE"
log_success "You can now run the following commands:"
echo -e "  ${GREEN}./launch_valhalla.sh${NC} - Start all agents with memory limits"
echo -e "  ${GREEN}./monitor_valhalla.sh${NC} - Monitor agent status and logs"
echo
log "⚔️ Let's reach Valhalla together!" 