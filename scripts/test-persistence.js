#!/usr/bin/env node

/**
 * Simple Persistence Test Script
 * Tests conversation persistence by directly accessing SQLite
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get command line arguments
const groupId = process.argv[2] || 'test_group';
const agentId = process.argv[3] || process.env.AGENT_ID || 'test_agent';

// Find database path
const dbPath = process.env.SQLITE_FILE ||
    process.env.DATABASE_PATH ||
    path.resolve(process.cwd(), './data/conversation.db');

console.log(`🔍 Using database at: ${dbPath}`);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created directory: ${dbDir}`);
}

// Connect to database
let db;
try {
    db = new sqlite3(dbPath);
    console.log('✅ Connected to database');
} catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
}

// Create schema if needed
try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      status TEXT NOT NULL,
      lastMessageTimestamp INTEGER,
      lastSpeakerId TEXT,
      participants TEXT,
      messageCount INTEGER,
      currentTopic TEXT,
      lastUpdated INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_conversations_groupId 
    ON conversations(groupId);
    
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_messages_groupId 
    ON messages(groupId);
  `);
    console.log('✅ Schema created/verified');
} catch (err) {
    console.error('❌ Error creating schema:', err.message);
    db.close();
    process.exit(1);
}

// Check for existing state
const conversationId = `telegram-${groupId}`;
const existingState = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);

if (existingState) {
    // Parse participants
    let participants = [];
    try {
        participants = JSON.parse(existingState.participants || '[]');
    } catch (err) {
        participants = [];
    }

    console.log('📋 Found existing conversation state:');
    console.log(`- Last speaker: ${existingState.lastSpeakerId}`);
    console.log(`- Participants: ${participants.join(', ')}`);
    console.log(`- Message count: ${existingState.messageCount}`);
    console.log(`- Last updated: ${new Date(existingState.lastUpdated).toISOString()}`);

    // Get related messages
    const messages = db.prepare('SELECT * FROM messages WHERE groupId = ? ORDER BY timestamp DESC LIMIT 5').all(groupId);

    if (messages.length > 0) {
        console.log('\n💬 Last messages:');
        messages.forEach(msg => {
            console.log(`- [${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.userId}: ${msg.text}`);
        });
    } else {
        console.log('\n💬 No messages found');
    }
} else {
    console.log('🆕 No existing conversation state found. Creating new state...');

    // Create a new conversation state
    const now = Date.now();
    const participants = [agentId, 'test_user'];

    // Insert new conversation
    db.prepare(`
    INSERT INTO conversations 
    (id, groupId, status, lastMessageTimestamp, lastSpeakerId, participants, messageCount, currentTopic, lastUpdated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        conversationId,
        groupId.toString(),
        'active',
        now,
        'test_user',
        JSON.stringify(participants),
        1,
        '',
        now
    );

    console.log('✅ Created new conversation state:');
    console.log(`- Last speaker: test_user`);
    console.log(`- Participants: ${participants.join(', ')}`);

    // Insert test message
    const messageId = `msg-${now}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
    INSERT INTO messages (id, groupId, userId, text, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        messageId,
        groupId.toString(),
        'test_user',
        'Test message for persistence',
        now
    );

    // Now record a message from the agent
    const agentMessageId = `msg-${now + 1000}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
    INSERT INTO messages (id, groupId, userId, text, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        agentMessageId,
        groupId.toString(),
        agentId,
        'Test response from agent',
        now + 1000
    );

    // Update conversation state to reflect agent as last speaker
    db.prepare(`
    UPDATE conversations
    SET lastSpeakerId = ?, lastMessageTimestamp = ?, messageCount = 2, lastUpdated = ?
    WHERE id = ?
  `).run(
        agentId,
        now + 1000,
        now + 1000,
        conversationId
    );

    // Get updated state
    const updatedState = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);

    if (updatedState) {
        console.log('🔄 State after agent response:');
        console.log(`- Last speaker: ${updatedState.lastSpeakerId}`);
        console.log(`- Participants: ${participants.join(', ')}`);
    }

    console.log('\n🔄 Persistence test completed.');
    console.log('⏭️ Restart the agent and run this test again to verify persistence.');
}

// Close database
db.close();
console.log('\n✅ Database connection closed'); 