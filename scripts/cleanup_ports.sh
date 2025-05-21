#!/bin/bash

echo "🧹 Cleaning up ports and processes..."

# Define the ports to clean up
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010)

# Identify and kill processes using these ports
for PORT in "${PORTS[@]}"; do
  echo "Checking port $PORT..."
  PIDS=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Found processes using port $PORT: $PIDS"
    for PID in $PIDS; do
      echo "Killing process $PID..."
      kill -9 $PID 2>/dev/null || echo "Failed to kill process $PID"
    done
    echo "Port $PORT should now be free"
  else
    echo "Port $PORT is already free"
  fi
done

# Kill any node processes that might be agents
echo "Checking for agent processes..."
AGENT_KEYWORDS=("eth_memelord_9000" "vc_shark_99" "code_samurai_77" "bitcoin_maxi_420" "bag_flipper_9000" "linda_evangelista_88")

for KEYWORD in "${AGENT_KEYWORDS[@]}"; do
  PIDS=$(ps aux | grep "$KEYWORD" | grep -v grep | awk '{print $2}')
  if [ -n "$PIDS" ]; then
    echo "Found processes for $KEYWORD: $PIDS"
    for PID in $PIDS; do
      echo "Killing process $PID..."
      kill -9 $PID 2>/dev/null || echo "Failed to kill process $PID"
    done
  else
    echo "No processes found for $KEYWORD"
  fi
done

# Check for any remaining Node processes using a lot of memory
echo "Checking for high-memory Node.js processes..."
HIGH_MEM_PIDS=$(ps aux | grep "node" | grep -v grep | awk '$6 > 300000 {print $2}')
if [ -n "$HIGH_MEM_PIDS" ]; then
  echo "Found high-memory Node.js processes: $HIGH_MEM_PIDS"
  for PID in $HIGH_MEM_PIDS; do
    echo "Killing high-memory process $PID..."
    kill -9 $PID 2>/dev/null || echo "Failed to kill process $PID"
  done
fi

# Check if any database files are locked
echo "Checking for locked SQLite database files..."
find . -name "*.db" -type f | while read -r db_file; do
  echo "Checking $db_file..."
  # Try to open and close the database to check if it's locked
  if sqlite3 "$db_file" "SELECT 1;" >/dev/null 2>&1; then
    echo "Database $db_file is accessible"
  else
    echo "Database $db_file might be locked, attempting to repair..."
    # Try to recover the database
    cp "$db_file" "${db_file}.bak" 2>/dev/null
    echo "Backup created at ${db_file}.bak"
    # Force cleanup by removing the file if it's small (likely empty/corrupted)
    if [ $(stat -c%s "$db_file") -lt 10000 ]; then
      echo "Database file is small, removing it to allow recreation..."
      rm "$db_file" 2>/dev/null
    fi
  fi
done

# Clean up any temporary files that might be left over
echo "Cleaning up temporary files..."
find /tmp -name "elizaos-*" -type f -mmin +60 -delete 2>/dev/null
find . -name "*.tmp" -type f -mmin +60 -delete 2>/dev/null

# Verify ports are actually free now
echo "Verifying ports are free..."
for PORT in "${PORTS[@]}"; do
  if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️ Warning: Port $PORT is still in use!"
  else
    echo "✅ Port $PORT is free"
  fi
done

echo "✅ Cleanup completed" 