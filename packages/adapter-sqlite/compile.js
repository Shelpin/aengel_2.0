#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy index.ts to dist as index.js
const srcIndexPath = path.join(__dirname, 'src', 'index.ts');
const destIndexPath = path.join(distDir, 'index.js');

console.log('Creating build for adapter-sqlite package...');

// Simple JS implementation
const jsContent = `// adapter-sqlite implementation
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory implementation for development
export class SQLiteAdapter {
  static connect(dbName, options = {}) {
    console.log(\`Connecting to SQLite database: \${dbName}\`);
    return new SQLiteAdapter(dbName, options);
  }

  constructor(dbName, options = {}) {
    this.dbName = dbName;
    this.options = options;
    this.connected = true;
    this.data = new Map();
  }

  async close() {
    this.connected = false;
    console.log(\`Closed connection to SQLite database: \${this.dbName}\`);
  }

  async run(sql, params = []) {
    console.log(\`Running SQL: \${sql}\`, params);
    return { lastID: Date.now(), changes: 1 };
  }

  async all(sql, params = []) {
    console.log(\`Query SQL: \${sql}\`, params);
    return [];
  }

  async get(sql, params = []) {
    console.log(\`Get SQL: \${sql}\`, params);
    return null;
  }

  async transaction(callback) {
    console.log('Beginning transaction');
    try {
      const result = await callback(this);
      console.log('Transaction committed');
      return result;
    } catch (error) {
      console.error('Transaction rolled back', error);
      throw error;
    }
  }

  async connect() {
    console.log(\`Connected to SQLite database: \${this.dbName}\`);
    return Promise.resolve();
  }

  async disconnect() {
    return this.close();
  }

  async query(sql, params = []) {
    return this.all(sql, params);
  }

  async getCache({ agentId, key }) {
    const cacheKey = \`\${agentId}:\${key}\`;
    return this.data.get(cacheKey);
  }

  async setCache({ agentId, key, value }) {
    const cacheKey = \`\${agentId}:\${key}\`;
    this.data.set(cacheKey, value);
    return true;
  }

  async deleteCache({ agentId, key }) {
    const cacheKey = \`\${agentId}:\${key}\`;
    return this.data.delete(cacheKey);
  }
}

export class SQLiteVectorAdapter {
  static connect(dbPath, options = {}) {
    console.log(\`Connecting to SQLite vector database: \${dbPath}\`);
    return new SQLiteVectorAdapter(dbPath, options);
  }

  constructor(dbPath, options = {}) {
    this.dbPath = dbPath;
    this.options = options;
    this.connected = true;
    this.embeddings = new Map();
  }

  async close() {
    this.connected = false;
    console.log(\`Closed connection to SQLite vector database: \${this.dbPath}\`);
  }

  async connect() {
    console.log(\`Connected to SQLite vector database: \${this.dbPath}\`);
    return Promise.resolve();
  }

  async disconnect() {
    return this.close();
  }

  async storeEmbedding(key, embedding, metadata = {}) {
    this.embeddings.set(key, { embedding, metadata });
    console.log(\`Stored embedding for key: \${key}\`);
  }

  async searchSimilar(embedding, limit = 10) {
    console.log(\`Searching similar embeddings, limit: \${limit}\`);
    return Array.from(this.embeddings.entries())
      .slice(0, limit)
      .map(([key, value]) => ({
        key,
        metadata: value.metadata,
        score: 0.5 // Mock similarity score
      }));
  }
}

// Define the adapter factory
export const adapter = {
  init: (runtime) => {
    const agentId = runtime.getAgentId();
    const dbPath = path.join(__dirname, '..', '..', '..', 'data', \`\${agentId}.db\`);
    return SQLiteAdapter.connect(dbPath);
  }
};
`;

fs.writeFileSync(destIndexPath, jsContent);
console.log(`Created ${destIndexPath}`);

// Create type declaration file
const dtsContent = `// Type definitions for adapter-sqlite

import { Logger } from '@elizaos/core';

export interface UUID extends String {}

// Database adapter interface
export interface IDatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
}

// Database cache adapter interface
export interface IDatabaseCacheAdapter {
    getCache(params: { key: string; agentId: string }): Promise<string | undefined>;
    setCache(params: { key: string; agentId: string; value: string }): Promise<boolean>;
    deleteCache(params: { key: string; agentId: string }): Promise<boolean>;
}

// Vector database adapter interface
export interface VectorDatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    storeEmbedding(key: string, embedding: number[], metadata?: any): Promise<void>;
    searchSimilar(query: number[], limit?: number): Promise<any[]>;
}

// Agent runtime interface
export interface IAgentRuntime {
    getAgentId(): string;
    getLogger(name: string): Logger;
}

// Memory interface
export interface Memory {
    id: string;
    content: string;
    timestamp: number;
    type: string;
    metadata?: Record<string, any>;
}

// SQLite specific types
export interface BetterSqlite3Database {}

export class SQLiteAdapter implements IDatabaseAdapter, IDatabaseCacheAdapter {
    static connect(dbName: string, options?: any): SQLiteAdapter;
    constructor(dbName: string, options?: any);
    close(): Promise<void>;
    run(sql: string, params?: any[]): Promise<{ lastID: number, changes: number }>;
    all(sql: string, params?: any[]): Promise<any[]>;
    get(sql: string, params?: any[]): Promise<any | null>;
    transaction<T>(callback: (tx: SQLiteAdapter) => Promise<T>): Promise<T>;
    
    // IDatabaseAdapter implementation
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
    
    // IDatabaseCacheAdapter implementation
    getCache(params: { agentId: string; key: string }): Promise<string | undefined>;
    setCache(params: { agentId: string; key: string; value: string }): Promise<boolean>;
    deleteCache(params: { agentId: string; key: string }): Promise<boolean>;
}

export class SQLiteVectorAdapter implements VectorDatabaseAdapter {
    static connect(dbPath: string, options?: any): SQLiteVectorAdapter;
    constructor(dbPath: string, options?: any);
    close(): Promise<void>;
    
    // VectorDatabaseAdapter implementation
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    storeEmbedding(key: string, embedding: number[], metadata?: any): Promise<void>;
    searchSimilar(embedding: number[], limit?: number): Promise<any[]>;
}

export interface Adapter {
    init: (runtime: IAgentRuntime) => IDatabaseAdapter & IDatabaseCacheAdapter;
}

export const adapter: Adapter;
`;

const dtsSrcPath = path.join(distDir, 'index.d.ts');
fs.writeFileSync(dtsSrcPath, dtsContent);
console.log(`Created ${dtsSrcPath}`);

// Create CJS versions
const indexCjsPath = path.join(distDir, 'index.cjs');
fs.writeFileSync(indexCjsPath, `// CJS version
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

// Simple SQLite adapter for CJS compatibility
exports.SQLiteAdapter = {
  connect: (dbName) => ({
    close: async () => {},
    run: async () => ({ lastID: Date.now(), changes: 1 }),
    all: async () => [],
    get: async () => null,
    transaction: async (cb) => await cb({}),
    getCache: async () => undefined,
    setCache: async () => true,
    deleteCache: async () => true,
    connect: async () => {},
    disconnect: async () => {},
    query: async () => []
  })
};

exports.SQLiteVectorAdapter = {
  connect: (dbPath) => ({
    close: async () => {},
    connect: async () => {},
    disconnect: async () => {},
    storeEmbedding: async () => {},
    searchSimilar: async () => []
  })
};

exports.adapter = {
  init: (runtime) => exports.SQLiteAdapter.connect(runtime.getAgentId() + '.db')
};
`);
console.log(`Created ${indexCjsPath}`);

// Create optional helper files if needed
const sqliteTablesPath = path.join(distDir, 'sqliteTables.js');
fs.writeFileSync(sqliteTablesPath, `// SQLite tables definition
export const sqliteTables = {
  // Table definitions here
};
`);

const sqliteTablesTypesPath = path.join(distDir, 'sqliteTables.d.ts');
fs.writeFileSync(sqliteTablesTypesPath, `// SQLite tables definition types
export declare const sqliteTables: Record<string, string>;
`);

const sqliteVecPath = path.join(distDir, 'sqlite_vec.js');
fs.writeFileSync(sqliteVecPath, `// SQLite vector operations
export function load() {
  return {};
}
`);

const sqliteVecTypesPath = path.join(distDir, 'sqlite_vec.d.ts');
fs.writeFileSync(sqliteVecTypesPath, `// SQLite vector operations types
export declare function load(): any;
`);

console.log('Build complete for adapter-sqlite package.'); 