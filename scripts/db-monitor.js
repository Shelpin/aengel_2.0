#!/usr/bin/env node

/**
 * Database Monitor Utility
 * 
 * This script directly accesses the database to display conversation state and messages
 * for monitoring and debugging purposes.
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

// Attempt to load dotenv
try {
    const dotenv = require('dotenv');
    dotenv.config();
} catch (err) {
    console.log('Dotenv not available, proceeding with environment as-is');
}

// Find database path
const DB_PATH = process.env.SQLITE_FILE ||
    process.env.DATABASE_PATH ||
    path.resolve(process.cwd(), './data/conversation.db');

console.log(`🔍 Examining database at: ${DB_PATH}`);

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database file not found at: ${DB_PATH}`);
    console.log('💡 Ensure the agent has been started at least once');
    process.exit(1);
}

// Load SQLite
let Database;
try {
    Database = require('better-sqlite3');
} catch (err) {
    console.error('❌ better-sqlite3 not available. Install with: npm install better-sqlite3');
    process.exit(1);
}

// Connect to database
let db;
try {
    db = new Database(DB_PATH, { readonly: true });
    console.log('✅ Connected to database');
} catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
}

// Command-line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'help';
const param = args[1] || '';

// Display help
function showHelp() {
    console.log(`
Database Monitor Commands:
  conversations                 - List all conversations
  conversation <groupId>        - Show details for a specific conversation
  messages <groupId> [limit]    - Show messages for a group (default limit: 10)
  help                          - Show this help message
  `);
}

// List all conversations
function listConversations() {
    try {
        // Check if table exists
        const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'`).get();

        if (!tableExists) {
            console.log('⚠️ No conversations table found in database');
            return;
        }

        const conversations = db.prepare('SELECT * FROM conversations ORDER BY lastUpdated DESC').all();

        if (conversations.length === 0) {
            console.log('ℹ️ No conversations found');
            return;
        }

        console.log(`\n📋 Found ${conversations.length} conversations:\n`);

        conversations.forEach(conv => {
            // Parse participants JSON
            let participants = [];
            try {
                participants = JSON.parse(conv.participants || '[]');
            } catch (err) {
                participants = [];
            }

            console.log(`
Group ID: ${conv.groupId}
Status: ${conv.status}
Last Speaker: ${conv.lastSpeakerId || 'None'}
Message Count: ${conv.messageCount || 0}
Participants: ${participants.join(', ') || 'None'}
Last Updated: ${new Date(conv.lastUpdated).toISOString()}
-------------------------------------------`);
        });
    } catch (err) {
        console.error('❌ Error listing conversations:', err.message);
    }
}

// Show a single conversation
function showConversation(groupId) {
    if (!groupId) {
        console.error('❌ Please provide a groupId');
        return;
    }

    try {
        // Check if table exists
        const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'`).get();

        if (!tableExists) {
            console.log('⚠️ No conversations table found in database');
            return;
        }

        const conversationId = `telegram-${groupId}`;
        const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);

        if (!conversation) {
            console.log(`ℹ️ No conversation found for group ID: ${groupId}`);
            return;
        }

        // Parse participants JSON
        let participants = [];
        try {
            participants = JSON.parse(conversation.participants || '[]');
        } catch (err) {
            participants = [];
        }

        console.log(`
📝 Conversation Details for Group ID: ${groupId}
-------------------------------------------
Status: ${conversation.status}
Last Speaker: ${conversation.lastSpeakerId || 'None'}
Message Count: ${conversation.messageCount || 0}
Current Topic: ${conversation.currentTopic || 'None'}
Last Message Time: ${new Date(conversation.lastMessageTimestamp).toISOString()}
Participants: ${participants.join(', ') || 'None'}
Last Updated: ${new Date(conversation.lastUpdated).toISOString()}
-------------------------------------------`);
    } catch (err) {
        console.error(`❌ Error showing conversation for ${groupId}:`, err.message);
    }
}

// Show messages for a group
function showMessages(groupId, limit = 10) {
    if (!groupId) {
        console.error('❌ Please provide a groupId');
        return;
    }

    try {
        // Check if table exists
        const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='messages'`).get();

        if (!tableExists) {
            console.log('⚠️ No messages table found in database');
            return;
        }

        const messages = db.prepare(
            'SELECT * FROM messages WHERE groupId = ? ORDER BY timestamp DESC LIMIT ?'
        ).all(groupId, limit);

        if (messages.length === 0) {
            console.log(`ℹ️ No messages found for group ID: ${groupId}`);
            return;
        }

        console.log(`\n💬 Last ${messages.length} messages for Group ID: ${groupId}\n`);

        messages.forEach(msg => {
            console.log(`
Time: ${new Date(msg.timestamp).toLocaleString()}
From: ${msg.userId}
Message: ${msg.text}
-------------------------------------------`);
        });
    } catch (err) {
        console.error(`❌ Error showing messages for ${groupId}:`, err.message);
    }
}

// Execute requested command
switch (command) {
    case 'conversations':
        listConversations();
        break;
    case 'conversation':
        showConversation(param);
        break;
    case 'messages':
        const limit = args[2] ? parseInt(args[2], 10) : 10;
        showMessages(param, limit);
        break;
    case 'help':
    default:
        showHelp();
        break;
}

// Clean up
db.close();
console.log('\n✅ Database connection closed'); 