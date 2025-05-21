#!/bin/bash

# Clear all agent logs without stopping the agents
# This is useful to clear error spam quickly

LOG_DIR="/root/eliza/logs"

# Truncate all log files and add header
for logfile in $LOG_DIR/*.log; do
  # Skip if not a regular file
  [ -f "$logfile" ] || continue
  
  # Make backup first
  cp "$logfile" "${logfile}.bak"
  
  # Clear log file and add timestamp
  echo "Logs cleared at $(date)" > "$logfile"
  
  echo "Cleared $logfile"
done

echo "All logs have been cleared" 