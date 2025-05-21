#!/usr/bin/env node

/**
 * SQLite Database Health Check Utility
 * 
 * This script performs diagnostics on SQLite databases used by Eliza agents.
 * It checks:
 * - File existence and permissions
 * - Schema integrity
 * - Ability to perform basic queries
 * - Attempts repairs when issues are found
 * 
 * Usage:
 * node tools/check-sqlite.js [database-path]
 * 
 * Example:
 * node tools/check-sqlite.js agent/data/db.sqlite
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('better-sqlite3');
const os = require('os');

// Configuration
const DEFAULT_PATH = 'agent/data/db.sqlite';
const TABLES_TO_CHECK = [
  'accounts', 
  'memories', 
  'participants', 
  'goals', 
  'rooms', 
  'relationships',
  'logs',
  'cache',
  'knowledge'
];

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Get database path from command line
const dbPath = process.argv[2] || DEFAULT_PATH;
console.log(`${COLORS.blue}[SQLite Check] Target database: ${dbPath}${COLORS.reset}`);

// Helper utility functions
function logSuccess(message) {
  console.log(`${COLORS.green}[SUCCESS] ${message}${COLORS.reset}`);
}

function logInfo(message) {
  console.log(`${COLORS.blue}[INFO] ${message}${COLORS.reset}`);
}

function logWarning(message) {
  console.log(`${COLORS.yellow}[WARNING] ${message}${COLORS.reset}`);
}

function logError(message) {
  console.log(`${COLORS.red}[ERROR] ${message}${COLORS.reset}`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Check if file exists and has appropriate permissions
function checkFilePermissions(filePath) {
  logInfo(`Checking file: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      logWarning(`Database file does not exist at ${filePath}`);
      
      // Check if directory exists, create it if not
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        logInfo(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create empty file to test permissions
      logInfo(`Testing write permissions in directory: ${dir}`);
      fs.writeFileSync(filePath, '');
      logSuccess(`Successfully created empty database file at ${filePath}`);
      
      return true;
    }
    
    // File exists, check permissions
    const stats = fs.statSync(filePath);
    logInfo(`File exists with size: ${formatBytes(stats.size)}`);
    
    // Get file permissions and owner
    const permissions = '0' + (stats.mode & parseInt('777', 8)).toString(8);
    const userInfo = os.userInfo();
    const currentUid = userInfo.uid;
    const fileOwner = stats.uid === currentUid ? 'current user' : stats.uid;
    
    logInfo(`File permissions: ${permissions}, owner: ${fileOwner}`);
    
    // Verify read/write access
    const isReadable = (stats.mode & fs.constants.R_OK) !== 0;
    const isWritable = (stats.mode & fs.constants.W_OK) !== 0;
    
    if (!isReadable || !isWritable) {
      logError(`File permission issues: readable=${isReadable}, writable=${isWritable}`);
      
      // Try to fix permissions
      try {
        logInfo(`Attempting to fix permissions...`);
        fs.chmodSync(filePath, 0o666);
        logSuccess(`Permission fix attempted. New permissions: 0666`);
      } catch (e) {
        logError(`Failed to modify permissions: ${e.message}`);
      }
    } else {
      logSuccess(`File has appropriate read/write permissions`);
    }
    
    return isReadable && isWritable;
  } catch (error) {
    logError(`Permission check failed: ${error.message}`);
    return false;
  }
}

// Test basic connectivity to the database
function testDatabaseConnection(dbPath) {
  logInfo(`Testing database connection...`);
  
  let db = null;
  try {
    // Try to open the database
    db = new sqlite3(dbPath, { 
      verbose: console.log 
    });
    
    // Run a simple query
    const result = db.prepare('SELECT sqlite_version() as version').get();
    logSuccess(`Successfully connected to SQLite database, version: ${result.version}`);
    
    // Check database page size and other settings
    const pageSize = db.prepare('PRAGMA page_size').get().page_size;
    const journalMode = db.prepare('PRAGMA journal_mode').get().journal_mode;
    const foreignKeys = db.prepare('PRAGMA foreign_keys').get().foreign_keys;
    
    logInfo(`Database settings: page_size=${pageSize}, journal_mode=${journalMode}, foreign_keys=${foreignKeys}`);
    
    // Recommend optimized settings
    if (journalMode !== 'wal') {
      logWarning(`Journal mode is ${journalMode}, WAL mode is recommended for better performance`);
      try {
        db.prepare('PRAGMA journal_mode = WAL').run();
        logSuccess(`Changed journal mode to WAL`);
      } catch (e) {
        logError(`Failed to set journal mode: ${e.message}`);
      }
    }
    
    if (foreignKeys !== 1) {
      logWarning(`Foreign keys are disabled, enabling...`);
      try {
        db.prepare('PRAGMA foreign_keys = ON').run();
        logSuccess(`Enabled foreign key constraints`);
      } catch (e) {
        logError(`Failed to enable foreign keys: ${e.message}`);
      }
    }
    
    return db;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    
    // If the database file exists but is corrupted, try to recover
    if (fs.existsSync(dbPath)) {
      logWarning(`Database file exists but may be corrupted. Attempting recovery...`);
      
      try {
        // Create a backup file
        const backupPath = `${dbPath}.backup.${Date.now()}`;
        fs.copyFileSync(dbPath, backupPath);
        logInfo(`Created backup at ${backupPath}`);
        
        // Try with recovery options
        db = new sqlite3(dbPath, { 
          readonly: true, // Open read-only first to not make things worse
          verbose: console.log
        });
        
        // Run integrity check
        const integrityResult = db.prepare('PRAGMA integrity_check').all();
        if (integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok') {
          logSuccess(`Database passed integrity check`);
        } else {
          logError(`Integrity check failed: ${JSON.stringify(integrityResult)}`);
          // Close read-only connection
          db.close();
          
          // Create a new database if recovery fails
          logWarning(`Creating new database file from scratch...`);
          fs.unlinkSync(dbPath);
          db = new sqlite3(dbPath, { verbose: console.log });
          logSuccess(`Created new SQLite database at ${dbPath}`);
        }
        
        return db;
      } catch (recoveryError) {
        logError(`Recovery failed: ${recoveryError.message}`);
        return null;
      }
    }
    
    return null;
  }
}

// Check database schema
function checkDatabaseSchema(db) {
  logInfo(`Checking database schema...`);
  
  try {
    // Get list of all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    logInfo(`Database contains ${tables.length} tables`);
    
    const tableNames = tables.map(t => t.name);
    logInfo(`Tables found: ${tableNames.join(', ')}`);
    
    // Check for required tables
    const missingTables = TABLES_TO_CHECK.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      logWarning(`Missing required tables: ${missingTables.join(', ')}`);
      return { valid: false, missingTables };
    }
    
    // Check required tables for proper structure
    let tablesWithIssues = [];
    
    // Check memories table specifically
    if (tableNames.includes('memories')) {
      try {
        const columns = db.prepare('PRAGMA table_info(memories)').all();
        const columnNames = columns.map(c => c.name);
        
        const requiredColumns = ['id', 'type', 'content', 'createdAt'];
        const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));
        
        if (missingColumns.length > 0) {
          logWarning(`'memories' table is missing columns: ${missingColumns.join(', ')}`);
          tablesWithIssues.push('memories');
        } else {
          // Try to see if data is valid JSON
          try {
            const sample = db.prepare('SELECT content FROM memories LIMIT 1').get();
            if (sample) {
              JSON.parse(sample.content);
              logSuccess(`Sample 'content' is valid JSON`);
            }
          } catch (e) {
            logWarning(`'memories' table has invalid JSON: ${e.message}`);
            tablesWithIssues.push('memories');
          }
        }
      } catch (e) {
        logError(`Error analyzing 'memories' table: ${e.message}`);
        tablesWithIssues.push('memories');
      }
    }
    
    if (tablesWithIssues.length > 0) {
      return { valid: false, tablesWithIssues };
    }
    
    logSuccess(`Database schema appears valid`);
    return { valid: true };
  } catch (error) {
    logError(`Schema check failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// Add this function to fix the memories table schema
function fixMemoriesSchema(db) {
  logInfo(`Attempting to fix 'memories' table schema...`);
  
  try {
    // First, check if we need to fix the embedding column
    const columns = db.prepare('PRAGMA table_info(memories)').all();
    const embeddingColumn = columns.find(c => c.name === 'embedding');
    
    if (embeddingColumn && embeddingColumn.notnull === 1) {
      logWarning(`Found NOT NULL constraint on embedding column, attempting to modify...`);
      
      // We need to recreate the table without the NOT NULL constraint
      // SQLite doesn't allow direct ALTER COLUMN to remove NOT NULL
      
      // 1. Create a backup of the current schema
      const backupFile = `${dbPath}.schema_backup.${Date.now()}.sql`;
      logInfo(`Creating schema backup at ${backupFile}`);
      
      // Execute .schema command and save to file
      try {
        const schemaResults = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' OR type='index'").all();
        fs.writeFileSync(backupFile, schemaResults.map(r => r.sql + ';').join('\n\n'));
        logSuccess(`Schema backup created at ${backupFile}`);
      } catch (backupError) {
        logError(`Failed to create schema backup: ${backupError.message}`);
      }
      
      // 2. Begin transaction
      db.prepare('BEGIN TRANSACTION').run();
      
      try {
        // 3. Create a new memories table with the fixed schema
        db.exec(`
          CREATE TABLE memories_new (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            content TEXT NOT NULL,
            embedding BLOB, -- Removed NOT NULL constraint
            userId TEXT,
            roomId TEXT,
            agentId TEXT,
            "unique" INTEGER DEFAULT 1 NOT NULL,
            FOREIGN KEY (userId) REFERENCES accounts(id),
            FOREIGN KEY (roomId) REFERENCES rooms(id),
            FOREIGN KEY (agentId) REFERENCES accounts(id)
          )
        `);
        
        // 4. Copy data from the old table, setting NULL for embedding if needed
        logInfo(`Copying data from memories to memories_new table...`);
        
        // Count original records
        const countOriginal = db.prepare('SELECT COUNT(*) as count FROM memories').get().count;
        logInfo(`Original table has ${countOriginal} records`);
        
        // Copy the data
        db.exec(`
          INSERT INTO memories_new (id, type, createdAt, content, embedding, userId, roomId, agentId, "unique")
          SELECT id, type, createdAt, content, embedding, userId, roomId, agentId, "unique" FROM memories
        `);
        
        // Count new records
        const countNew = db.prepare('SELECT COUNT(*) as count FROM memories_new').get().count;
        logInfo(`New table has ${countNew} records copied`);
        
        if (countNew < countOriginal) {
          logWarning(`Some records may not have been copied (${countOriginal - countNew} missing)`);
        }
        
        // 5. Drop the old table
        db.exec('DROP TABLE memories');
        
        // 6. Rename the new table to the original name
        db.exec('ALTER TABLE memories_new RENAME TO memories');
        
        // 7. Recreate any indexes that were on the original table
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS "memories_id_key" ON "memories" ("id")');
        
        // 8. Commit the transaction
        db.prepare('COMMIT').run();
        
        logSuccess(`Successfully fixed 'memories' table schema`);
        
        // Verify the fix worked
        const newColumns = db.prepare('PRAGMA table_info(memories)').all();
        const newEmbeddingColumn = newColumns.find(c => c.name === 'embedding');
        
        if (newEmbeddingColumn && newEmbeddingColumn.notnull === 0) {
          logSuccess(`Verified embedding column is now nullable`);
        } else {
          logError(`Failed to make embedding column nullable`);
        }
        
        return true;
      } catch (error) {
        // Rollback on error
        db.prepare('ROLLBACK').run();
        logError(`Error fixing schema: ${error.message}`);
        return false;
      }
    } else {
      logInfo(`'memories' table embedding column is already nullable or doesn't exist`);
      return false; // No changes needed
    }
  } catch (error) {
    logError(`Error checking memories schema: ${error.message}`);
    return false;
  }
}

// Modify the testMemoriesOperations function to check if we need to fix the schema first
function testMemoriesOperations(db) {
  logInfo(`Testing basic CRUD operations on 'memories' table...`);
  
  try {
    // Create a test memory
    const testId = `test-${Date.now()}`;
    const testContent = JSON.stringify({ text: "This is a test memory" });
    
    // Test insert
    try {
      db.prepare(`
        INSERT INTO memories (id, type, content, createdAt) 
        VALUES (?, ?, ?, ?)
      `).run(testId, 'test', testContent, Date.now());
      logSuccess(`Successfully inserted test record with ID: ${testId}`);
    } catch (insertError) {
      logError(`Insert test failed: ${insertError.message}`);
      
      // Check if the error is related to NOT NULL constraint
      if (insertError.message.includes('NOT NULL constraint failed: memories.embedding')) {
        logWarning(`NOT NULL constraint error on embedding column detected`);
        
        // Fix the schema and try again
        if (fixMemoriesSchema(db)) {
          try {
            // Try the insert again after fixing schema
            db.prepare(`
              INSERT INTO memories (id, type, content, createdAt) 
              VALUES (?, ?, ?, ?)
            `).run(testId, 'test', testContent, Date.now());
            logSuccess(`Successfully inserted test record after schema fix`);
          } catch (secondInsertError) {
            logError(`Insert still failed after schema fix: ${secondInsertError.message}`);
            return false;
          }
        } else {
          return false;
        }
      } else if (insertError.message.includes('no such table')) {
        logWarning(`Creating memories table...`);
        
        try {
          db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              content TEXT NOT NULL CHECK(json_valid(content)),
              createdAt INTEGER DEFAULT (strftime('%s','now')),
              roomId TEXT,
              agentId TEXT,
              userId TEXT,
              embedding BLOB
            )
          `);
          
          // Create indexes
          db.exec(`CREATE INDEX IF NOT EXISTS memories_type_idx ON memories(type)`);
          db.exec(`CREATE INDEX IF NOT EXISTS memories_createdAt_idx ON memories(createdAt)`);
          
          logSuccess(`Created 'memories' table`);
          
          // Try insert again
          db.prepare(`
            INSERT INTO memories (id, type, content, createdAt) 
            VALUES (?, ?, ?, ?)
          `).run(testId, 'test', testContent, Date.now());
          logSuccess(`Successfully inserted test record after table creation`);
        } catch (createError) {
          logError(`Failed to create memories table: ${createError.message}`);
          return false;
        }
      } else {
        return false;
      }
    }
    
    // Test select
    try {
      const result = db.prepare(`SELECT * FROM memories WHERE id = ?`).get(testId);
      if (result) {
        logSuccess(`Successfully read test record: ${result.id}`);
      } else {
        logWarning(`Test record not found after insertion`);
      }
    } catch (selectError) {
      logError(`Select test failed: ${selectError.message}`);
      return false;
    }
    
    // Test delete
    try {
      db.prepare(`DELETE FROM memories WHERE id = ?`).run(testId);
      logSuccess(`Successfully deleted test record`);
    } catch (deleteError) {
      logError(`Delete test failed: ${deleteError.message}`);
      return false;
    }
    
    logSuccess(`All basic operations on 'memories' table passed`);
    return true;
  } catch (error) {
    logError(`Memory operations test failed: ${error.message}`);
    return false;
  }
}

// Repair database if needed
function repairDatabase(db, dbPath, schemaResult) {
  logInfo(`Running database repair procedures...`);
  
  // Run VACUUM to rebuild the database file
  try {
    logInfo(`Running VACUUM to optimize database...`);
    db.exec('VACUUM');
    logSuccess(`VACUUM completed successfully`);
  } catch (vacuumError) {
    logError(`VACUUM failed: ${vacuumError.message}`);
  }
  
  // Run integrity check
  try {
    const integrityResult = db.prepare('PRAGMA integrity_check').all();
    if (integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok') {
      logSuccess(`Database integrity is OK`);
    } else {
      logError(`Database integrity issues detected: ${JSON.stringify(integrityResult)}`);
      
      // Create a backup and attempt a deeper repair
      const backupPath = `${dbPath}.corrupt.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      logInfo(`Created backup of corrupted database at: ${backupPath}`);
      
      // Close current db
      db.close();
      
      // Try to recover using a temporary database
      const tempDbPath = `${dbPath}.temp`;
      try {
        logInfo(`Creating a new clean database for recovery...`);
        const tempDb = new sqlite3(tempDbPath);
        
        // Create basic schema in the new database
        tempDb.exec(`
          CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            content TEXT NOT NULL CHECK(json_valid(content)),
            createdAt INTEGER DEFAULT (strftime('%s','now')),
            roomId TEXT,
            agentId TEXT,
            userId TEXT,
            embedding BLOB
          );
          CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT,
            username TEXT,
            email TEXT,
            avatarUrl TEXT,
            details TEXT CHECK(json_valid(details) OR details IS NULL)
          );
        `);
        
        logInfo(`Trying to salvage data from corrupted database...`);
        
        // Close temp db
        tempDb.close();
        
        // Replace the corrupted db with the clean one
        fs.unlinkSync(dbPath);
        fs.copyFileSync(tempDbPath, dbPath);
        fs.unlinkSync(tempDbPath);
        
        logSuccess(`Database repaired with new schema, original data backed up at ${backupPath}`);
        
        // Reopen the database
        return new sqlite3(dbPath);
      } catch (recoveryError) {
        logError(`Deep repair failed: ${recoveryError.message}`);
        logInfo(`You may need to manually restore from a backup or recreate the database`);
        return null;
      }
    }
  } catch (integrityError) {
    logError(`Integrity check failed: ${integrityError.message}`);
  }
  
  return db;
}

// Run all checks
async function runChecks() {
  // Step 1: Check file permissions
  const permissionsOk = checkFilePermissions(dbPath);
  
  if (!permissionsOk) {
    logWarning(`File permission issues must be fixed before proceeding`);
    process.exit(1);
  }
  
  // Step 2: Test database connection
  let db = testDatabaseConnection(dbPath);
  
  if (!db) {
    logError(`Unable to connect to database, cannot proceed with checks`);
    process.exit(1);
  }
  
  // Step 3: Check database schema
  const schemaResult = checkDatabaseSchema(db);
  
  if (!schemaResult.valid) {
    logWarning(`Schema issues detected, attempting repairs...`);
    db = repairDatabase(db, dbPath, schemaResult);
    
    if (!db) {
      logError(`Repair failed, manual intervention required`);
      process.exit(1);
    }
  }
  
  // Step 4: Test operations on memories table
  const opsResult = testMemoriesOperations(db);
  
  if (!opsResult) {
    logWarning(`Memory operations failed, you may need to fix the schema or repair data`);
  } else {
    logSuccess(`Memory operations test passed`);
  }
  
  // Final status
  logInfo(`Database check complete`);
  if (db) {
    db.close();
    logInfo(`Database connection closed`);
  }
  
  if (schemaResult.valid && opsResult) {
    logSuccess(`Database appears to be healthy and functioning correctly`);
  } else {
    logWarning(`Database has issues that should be addressed`);
  }
}

// Run the checks
runChecks().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 