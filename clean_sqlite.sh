#!/bin/bash

# VALHALLA FIX: Force SQLite DB regeneration script
# This script removes all SQLite database files and restarts the agents

echo "🧹 Cleaning SQLite database files..."

# Remove SQLite files in the agent/data directory
rm -rf /root/eliza/agent/data/*.sqlite
rm -rf /root/eliza/agent/data/*.sqlite-shm
rm -rf /root/eliza/agent/data/*.sqlite-wal
echo "✅ Removed SQLite files from agent/data/"

# Check for and remove any other SQLite files
for db_file in $(find /root/eliza -name "*.sqlite" -o -name "*.sqlite-shm" -o -name "*.sqlite-wal"); do
  echo "🗑️ Removing $db_file"
  rm -f "$db_file"
done

echo "✅ SQLite cleanup completed. Run ./clean_restart.sh to restart all agents." 