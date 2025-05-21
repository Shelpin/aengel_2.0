#!/bin/bash

# Start the Telegram Relay Server for ElizaOS Multi-Agent System

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run the relay server."
    exit 1
fi

# Set the script directory path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if the relay server file exists
RELAY_SERVER_FILE="$SCRIPT_DIR/server.js"
if [ ! -f "$RELAY_SERVER_FILE" ]; then
    echo "Error: Relay server file not found at $RELAY_SERVER_FILE"
    exit 1
fi

# Check if required packages are installed
if [ ! -d "$SCRIPT_DIR/node_modules/express" ] || [ ! -d "$SCRIPT_DIR/node_modules/body-parser" ] || [ ! -d "$SCRIPT_DIR/node_modules/cors" ]; then
    echo "Installing required packages..."
    cd "$SCRIPT_DIR" && npm install express body-parser cors dotenv
fi

# Load environment variables if .env exists
if [ -f "$PROJECT_DIR/.env" ]; then
    # Use port from .env file if it exists
    PORT=$(grep "^PORT=" "$PROJECT_DIR/.env" | cut -d '=' -f2 | tr -d '[:space:]')
    if [ -z "$PORT" ]; then
        # Try RELAY_SERVER_PORT
        PORT=$(grep "^RELAY_SERVER_PORT=" "$PROJECT_DIR/.env" | cut -d '=' -f2 | tr -d '[:space:]')
    fi
    
    # If still no port, try to extract from RELAY_SERVER_URL
    if [ -z "$PORT" ]; then
        RELAY_URL=$(grep "^RELAY_SERVER_URL=" "$PROJECT_DIR/.env" | cut -d '=' -f2 | tr -d '[:space:]')
        if [[ "$RELAY_URL" =~ :[0-9]+(/|$) ]]; then
            PORT=$(echo "$RELAY_URL" | sed -E 's/.*:([0-9]+)(\/.*)?$/\1/')
        fi
    fi
    
    # Default to 4000 if still no port
    if [ -z "$PORT" ]; then
        PORT=4000
    fi
    
    echo "Using PORT=$PORT from .env file"
else
    # Set the port (default: 4000)
    PORT=${1:-4000}
fi

# Check if relay server is already running
RUNNING_PID=$(pgrep -f "node.*$RELAY_SERVER_FILE")
if [ -n "$RUNNING_PID" ]; then
    echo "Relay server is already running with PID $RUNNING_PID"
    echo "To restart, use ./relay-server/stop-relay.sh first"
    exit 0
fi

# Log file path
LOG_FILE="$LOG_DIR/relay_server.log"

# Start the relay server in the background and log output
echo "Starting Telegram Relay Server on port $PORT..."
cd "$SCRIPT_DIR" && PORT=$PORT node $RELAY_SERVER_FILE > "$LOG_FILE" 2>&1 &

# Save the PID to a file for later use
echo $! > "$LOG_DIR/relay_server.pid"
echo "Relay server started with PID $!"
echo "Logs are being written to $LOG_FILE"
echo "Use './relay-server/stop-relay.sh' to stop the server"

# This script will keep running until the server is stopped with Ctrl+C 