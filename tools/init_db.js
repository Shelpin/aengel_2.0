const Database = require('better-sqlite3');
const db = new Database('/root/eliza/data/db.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT,
    embedding BLOB,
    metadata TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content, content=memories, content_rowid=rowid);
`);
console.log('✅ Database schema initialized.'); 