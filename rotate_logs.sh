#!/bin/bash

# Log rotation script for ElizaOS Multi-Agent System
# This will rotate logs when they exceed 10MB and keep the last 5 rotations

LOG_DIR="/root/eliza/logs"
MAX_SIZE_KB=10240  # 10MB
MAX_BACKUPS=5

for logfile in $LOG_DIR/*.log; do
  # Skip if not a regular file
  [ -f "$logfile" ] || continue
  
  # Get file size in KB
  size_kb=$(du -k "$logfile" | cut -f1)
  
  if [ $size_kb -ge $MAX_SIZE_KB ]; then
    echo "Rotating $logfile ($size_kb KB)"
    
    # Remove oldest backup if it exists
    if [ -f "${logfile}.${MAX_BACKUPS}" ]; then
      rm "${logfile}.${MAX_BACKUPS}"
    fi
    
    # Shift all backups
    for i in $(seq $((MAX_BACKUPS-1)) -1 1); do
      if [ -f "${logfile}.$i" ]; then
        mv "${logfile}.$i" "${logfile}.$((i+1))"
      fi
    done
    
    # Create new backup and clear current log
    cp "$logfile" "${logfile}.1"
    echo "Log rotated at $(date)" > "$logfile"
    
    echo "Rotated $logfile to ${logfile}.1"
  fi
done 