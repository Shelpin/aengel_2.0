#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p /root/eliza/data

# Initialize SQLite database with required tables
sqlite3 /root/eliza/data/db.sqlite <<EOF
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT,
  content TEXT,
  embedding BLOB,
  userId TEXT,
  roomId TEXT,
  agentId TEXT,
  \`unique\` INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT,
  token TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS participants (
  userId TEXT,
  roomId TEXT,
  userState TEXT,
  PRIMARY KEY (userId, roomId)
);

CREATE TABLE IF NOT EXISTS knowledge (
  id TEXT PRIMARY KEY,
  type TEXT,
  content TEXT,
  embedding BLOB,
  userId TEXT,
  roomId TEXT,
  agentId TEXT,
  \`unique\` INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT,
  userId TEXT,
  roomId TEXT,
  type TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  status TEXT,
  title TEXT,
  description TEXT,
  tasks TEXT,
  deadline INTEGER,
  createdAt INTEGER,
  userId TEXT,
  roomId TEXT,
  agentId TEXT
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  userId TEXT,
  targetUserId TEXT,
  type TEXT,
  strength REAL,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS caches (
  key TEXT PRIMARY KEY,
  value TEXT,
  expiresAt INTEGER
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_room ON memories(roomId);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agentId);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_agent ON knowledge(agentId);
EOF

echo "SQLite database initialized successfully at /root/eliza/data/db.sqlite" 