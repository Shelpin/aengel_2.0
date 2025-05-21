#!/bin/bash
# ElizaOS SQLite Database Setup Script

# Create data directory if it doesn't exist
mkdir -p /root/eliza/data

# Initialize SQLite database with proper schema
sqlite3 /root/eliza/data/db.sqlite <<EOF
-- ElizaOS required tables
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  agentId TEXT NOT NULL,
  userId TEXT,
  timestamp INTEGER NOT NULL,
  content TEXT NOT NULL,
  vector BLOB,
  metadata TEXT,
  embedding BLOB
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  groupId TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lastSeen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_memories_agentId ON memories(agentId);
CREATE INDEX IF NOT EXISTS idx_memories_userId ON memories(userId);
CREATE INDEX IF NOT EXISTS idx_messages_agentId ON messages(agentId);
CREATE INDEX IF NOT EXISTS idx_messages_userId ON messages(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_groupId ON conversations(groupId);
EOF

# Set permissions
chmod 666 /root/eliza/data/db.sqlite
echo "SQLite database initialized at /root/eliza/data/db.sqlite"

# Verify tables were created
echo "Verifying database schema..."
sqlite3 /root/eliza/data/db.sqlite ".tables" 