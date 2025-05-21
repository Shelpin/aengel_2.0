// Database initialization script
// This script ensures that all required tables exist in the SQLite database

// Require better-sqlite3
const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('[DB INIT] Database initialization script starting...');

// Database paths
const dbPaths = [
  './packages/agent/data/telegram-multiagent.db',
  './packages/telegram-multiagent/test_memory.db'
];

// Ensure directories exist
for (const dbPath of dbPaths) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    console.log(`[DB INIT] Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initialize each database
for (const dbPath of dbPaths) {
  console.log(`[DB INIT] Initializing database: ${dbPath}`);
  
  try {
    // Open the database (creates it if it doesn't exist)
    const db = sqlite3(dbPath);
    
    // Create the memories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'message',
        agent_id TEXT NOT NULL,
        conversation_id TEXT,
        content TEXT NOT NULL,
        source TEXT,
        timestamp INTEGER DEFAULT (unixepoch()),
        metadata TEXT,
        embedding TEXT,
        UNIQUE(id)
      );
    `);
    console.log(`[DB INIT] Created 'memories' table in ${dbPath}`);
    
    // Create index on agent_id for faster queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memories_agent_id ON memories(agent_id);
    `);
    console.log(`[DB INIT] Created index on agent_id in ${dbPath}`);
    
    // Create index on type for faster filtering
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
    `);
    console.log(`[DB INIT] Created index on type in ${dbPath}`);
    
    // Create any other required tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT,
        timestamp INTEGER DEFAULT (unixepoch()),
        metadata TEXT
      );
    `);
    console.log(`[DB INIT] Created 'conversations' table in ${dbPath}`);
    
    // Create messaging tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        from_id TEXT NOT NULL,
        text TEXT,
        timestamp INTEGER DEFAULT (unixepoch()),
        metadata TEXT
      );
    `);
    console.log(`[DB INIT] Created 'messages' table in ${dbPath}`);
    
    // Close the database connection
    db.close();
    console.log(`[DB INIT] Successfully initialized database: ${dbPath}`);
  } catch (error) {
    console.error(`[DB INIT] Error initializing database ${dbPath}:`, error);
  }
}

console.log('[DB INIT] Database initialization complete!'); 