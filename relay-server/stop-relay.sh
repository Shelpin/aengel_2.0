#!/bin/bash

# Stop the Telegram Relay Server for ElizaOS Multi-Agent System

# Set the script directory path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/relay_server.pid"

# Check if the PID file exists
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    
    # Check if the process is running
    if ps -p "$PID" > /dev/null; then
        echo "Stopping Telegram Relay Server (PID: $PID)..."
        kill "$PID"
        
        # Wait for process to terminate
        count=0
        while ps -p "$PID" > /dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null; then
            echo "Process did not terminate gracefully, forcing..."
            kill -9 "$PID"
        fi
        
        echo "Telegram Relay Server stopped."
    else
        echo "No Telegram Relay Server process found with PID $PID."
    fi
    
    # Remove PID file
    rm -f "$PID_FILE"
else
    # Try to find the process directly
    RELAY_PID=$(pgrep -f "node.*relay-server/server.js")
    
    if [ -n "$RELAY_PID" ]; then
        echo "Found Telegram Relay Server with PID $RELAY_PID."
        echo "Stopping process..."
        kill "$RELAY_PID"
        
        # Wait for process to terminate
        count=0
        while ps -p "$RELAY_PID" > /dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if ps -p "$RELAY_PID" > /dev/null; then
            echo "Process did not terminate gracefully, forcing..."
            kill -9 "$RELAY_PID"
        fi
        
        echo "Telegram Relay Server stopped."
    else
        echo "No Telegram Relay Server process found."
    fi
fi

# If requested, remove log file
if [ "$1" == "--clean-logs" ]; then
    LOG_FILE="$LOG_DIR/relay_server.log"
    if [ -f "$LOG_FILE" ]; then
        rm -f "$LOG_FILE"
        echo "Relay server log file removed."
    fi
fi 