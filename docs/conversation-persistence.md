# Conversation State Persistence Testing

This document explains how to verify that conversation state persists correctly across agent restarts.

## 🔄 Persistence Mechanism

The ConversationManager component provides three-tiered persistence for conversation state:

1. **Primary**: Uses ElizaOS runtime's memoryManager
2. **Secondary**: Falls back to direct SQLite via ConversationDatabaseHelper if runtime memoryManager isn't persistent
3. **Last Resort**: Uses in-memory FallbackMemoryManager (non-persistent)

## 🧪 Testing Persistence

To verify persistence, we've provided two utilities:

### 1. Database Persistence Test

This test script creates a conversation and speaker history, then expects to find it after a restart.

```bash
# Run the initial test (creates conversation state)
./scripts/test-db-persistence.sh [group_id] [agent_id]

# Restart the agent, then run the test again to verify state persists
./scripts/test-db-persistence.sh [group_id] [agent_id]
```

Expected outcomes:
- First run: "No existing conversation state found. Creating new state..."
- Second run: "Found existing conversation state..."

### 2. Database Monitor

For more detailed examination of the database:

```bash
# Show all conversations
node scripts/db-monitor.js conversations

# Show details for a specific conversation
node scripts/db-monitor.js conversation [group_id]

# Show messages for a group
node scripts/db-monitor.js messages [group_id] [limit]
```

## 🕵️ Debugging Persistence Issues

If state isn't persisting, check:

1. **Memory Manager Type**: Look for these log messages:
   - "[MEMORY] Successfully assigned runtime.memoryManager." (primary)
   - "[MEMORY_FALLBACK] Successfully initialized persistent SQLite fallback" (secondary)
   - "[MEMORY_GET] Using fallback memory manager (in-memory)" (last resort)

2. **Database Path**: Ensure the correct database path is being used:
   - Environment variables: SQLITE_FILE or DATABASE_PATH
   - Runtime settings: getSetting('SQLITE_FILE') or getSetting('DATABASE_PATH')
   - Default: './data/conversation.db'

3. **File Permissions**: Ensure the database file and directory are writable

4. **SQLite Installation**: Verify that better-sqlite3 is installed and working:
   ```bash
   npm list better-sqlite3
   ```

## 🔢 Schema Reference

The ConversationManager maintains the following schema when using direct SQLite:

### Conversations Table
```sql
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,           -- Format: telegram-[groupId]
  groupId TEXT NOT NULL,         -- Telegram group ID
  status TEXT NOT NULL,          -- active or inactive
  lastMessageTimestamp INTEGER,  -- Timestamp of last message
  lastSpeakerId TEXT,            -- ID of last speaker
  participants TEXT,             -- JSON array of participant IDs
  messageCount INTEGER,          -- Number of messages in conversation
  currentTopic TEXT,             -- Current conversation topic
  lastUpdated INTEGER            -- Timestamp of last update
)
```

### Messages Table
```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,         -- Format: msg-[timestamp]-[random]
  groupId TEXT NOT NULL,       -- Telegram group ID
  userId TEXT NOT NULL,        -- User or agent ID
  text TEXT NOT NULL,          -- Message text
  timestamp INTEGER NOT NULL   -- Message timestamp
)
``` 