import path from "node:path";
import DatabaseConstructor, { type Database, type Statement } from "better-sqlite3";
import { type UUID, type Memory, type Goal, type GoalStatus, type Actor, type Relationship, type RAGKnowledgeItem, type Account, type Participant, type IAgentRuntime, type IDatabaseAdapter, elizaLogger as logger } from "@elizaos/core";

/**
 * Simple SQLite adapter class that implements the required interfaces
 */
export class SQLiteAdapter implements IDatabaseAdapter {
    dbPath: string;
    private db: Database | null = null;
    private connected: boolean = false;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Connect to a SQLite database
     */
    static async connect(dbName: string, options = {}): Promise<SQLiteAdapter> {
        const dbPath = typeof dbName === 'string' && dbName !== ':memory:'
            ? path.resolve(process.cwd(), dbName)
            : ':memory:';
        logger.info(`[SQLiteAdapter] Resolved DB path: ${dbPath}`);
        const adapter = new SQLiteAdapter(dbPath);
        await adapter.connect();
        await adapter.init();
        return adapter;
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        try {
            logger.info(`[SQLiteAdapter] Attempting to connect to SQLite database: ${this.dbPath}`);
            this.db = new DatabaseConstructor(this.dbPath, { verbose: console.log });
            this.db.pragma('journal_mode = WAL');
            this.connected = true;
            logger.info(`[SQLiteAdapter] Successfully connected to SQLite database: ${this.dbPath}`);
        } catch (error) {
            logger.error(`[SQLiteAdapter] Error connecting to SQLite database: ${this.dbPath}`, error);
            this.connected = false;
            throw error;
        }
    }

    /**
     * Initialize database schema (create tables if they don't exist)
     */
    async init(): Promise<void> {
        if (!this.db || !this.connected) {
            logger.error("[SQLiteAdapter] Cannot initialize schema, database not connected.");
            throw new Error("Database not connected");
        }
        logger.info("[SQLiteAdapter] Initializing database schema...");
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    agentId TEXT,
                    roomId TEXT,
                    userId TEXT,
                    content TEXT,
                    createdAt INTEGER,
                    importance REAL,
                    lastAccessed INTEGER,
                    embedding TEXT
                );
            `);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_memories_roomId_createdAt ON memories (roomId, createdAt);`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_memories_agentId_roomId ON memories (agentId, roomId);`);

            logger.info("[SQLiteAdapter] Database schema initialized successfully.");
        } catch (error) {
            logger.error("[SQLiteAdapter] Error initializing database schema:", error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        if (this.db && this.connected) {
            try {
                this.db.close();
                this.connected = false;
                logger.info(`[SQLiteAdapter] Disconnected from SQLite database: ${this.dbPath}`);
            } catch (error) {
                logger.error(`[SQLiteAdapter] Error disconnecting from SQLite database: ${this.dbPath}`, error);
                throw error;
            }
        } else {
            logger.info("[SQLiteAdapter] Database already disconnected or not initialized.");
        }
    }

    /**
     * Execute a query (primarily for internal use or direct SQL if needed)
     */
    async query(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.db || !this.connected) {
            logger.error("[SQLiteAdapter] Cannot execute query, database not connected.");
            throw new Error("Database not connected");
        }
        logger.debug(`[SQLiteAdapter] Executing query: ${sql}`, params);
        try {
            const stmt: Statement = this.db.prepare(sql);
            if (sql.trim().toUpperCase().startsWith("SELECT")) {
                return stmt.all(params);
            } else {
                const info = stmt.run(params);
                return [info];
            }
        } catch (error) {
            logger.error(`[SQLiteAdapter] Error executing query: ${sql}`, error);
            throw error;
        }
    }

    // --- Memory Method Implementations --- 

    async getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]> {
        if (!this.db || !this.connected) throw new Error("Database not connected");
        const count = params.count || 10;
        logger.debug(`[SQLiteAdapter] getMemories for roomId: ${params.roomId}, agentId: ${params.agentId}, count: ${count}`);
        
        try {
            const stmt = this.db.prepare(
                `SELECT * FROM memories WHERE roomId = ? ORDER BY createdAt DESC LIMIT ?`
            );
            const rows = stmt.all(params.roomId, count) as any[];
            return rows.map(row => ({
                ...row,
                content: JSON.parse(row.content || '{}'),
                embedding: row.embedding ? JSON.parse(row.embedding) : undefined
            })).reverse();
        } catch (error) {
            logger.error(`[SQLiteAdapter] Error in getMemories for roomId ${params.roomId}:`, error);
            return [];
        }
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        if (!this.db || !this.connected) throw new Error("Database not connected");
        logger.debug(`[SQLiteAdapter] getMemoryById: ${id}`);
        try {
            const stmt = this.db.prepare("SELECT * FROM memories WHERE id = ?");
            const row = stmt.get(id) as any;
            if (row) {
                return {
                    ...row,
                    content: JSON.parse(row.content || '{}'),
                    embedding: row.embedding ? JSON.parse(row.embedding) : undefined
                };
            }
            return null;
        } catch (error) {
            logger.error(`[SQLiteAdapter] Error in getMemoryById for id ${id}:`, error);
            return null;
        }
    }
    
    async createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void> {
        if (!this.db || !this.connected) throw new Error("Database not connected");
        logger.debug(`[SQLiteAdapter] createMemory for id: ${memory.id}, unique: ${unique}`);

        try {
            if (unique) {
                const existing = await this.getMemoryById(memory.id);
                if (existing) {
                    logger.debug(`[SQLiteAdapter] Memory with id ${memory.id} already exists, skipping creation (unique=true).`);
                    return;
                }
            }

            const stmt = this.db.prepare(
                `INSERT INTO memories (id, agentId, roomId, userId, content, createdAt, importance, lastAccessed, embedding)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            stmt.run(
                memory.id,
                memory.agentId || this.dbPath.includes("agent.sqlite") ? "agent" : null,
                memory.roomId,
                memory.userId,
                JSON.stringify(memory.content || {}),
                memory.createdAt,
                memory.importance,
                memory.lastAccessed,
                memory.embedding ? JSON.stringify(memory.embedding) : null
            );
            logger.info(`[SQLiteAdapter] Memory created/updated successfully: ${memory.id}`);
        } catch (error) {
            logger.error(`[SQLiteAdapter] Error in createMemory for id ${memory.id}:`, error);
        }
    }

    // --- STUB IMPLEMENTATIONS (Keep the rest as stubs for now) --- 

    async getAccountById(userId: UUID): Promise<Account | null> {
        logger.warn("SQLiteAdapter.getAccountById not implemented");
        return null;
    }
    async createAccount(account: Account): Promise<boolean> {
        logger.warn("SQLiteAdapter.createAccount not implemented", account);
        return false;
    }
    async getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]> {
        logger.warn("SQLiteAdapter.getMemoriesByIds not implemented", ids, tableName);
        return [];
    }
    async getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]> {
        logger.warn("SQLiteAdapter.getMemoriesByRoomIds not implemented", params);
        return [];
    }
    async getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
        logger.warn("SQLiteAdapter.getCachedEmbeddings not implemented", params);
        return [];
    }
    async log(params: { body: { [key: string]: unknown }; userId: UUID; roomId: UUID; type: string; }): Promise<void> {
        logger.warn("SQLiteAdapter.log not implemented", params);
        return Promise.resolve();
    }
    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        logger.warn("SQLiteAdapter.getActorDetails not implemented", params);
        return [];
    }
    async searchMemories(params: { tableName: string; agentId: UUID; roomId: UUID; embedding: number[]; match_threshold: number; match_count: number; unique: boolean; }): Promise<Memory[]> {
        logger.warn("SQLiteAdapter.searchMemories not implemented", params);
        return [];
    }
    async updateGoalStatus(params: { goalId: UUID; status: GoalStatus; }): Promise<void> {
        logger.warn("SQLiteAdapter.updateGoalStatus not implemented", params);
        return Promise.resolve();
    }
    async searchMemoriesByEmbedding(embedding: number[], params: { match_threshold?: number; count?: number; roomId?: UUID; agentId?: UUID; unique?: boolean; tableName: string; }): Promise<Memory[]> {
        logger.warn("SQLiteAdapter.searchMemoriesByEmbedding not implemented", embedding, params);
        return [];
    }
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        logger.warn("SQLiteAdapter.removeMemory not implemented", memoryId, tableName);
        return Promise.resolve();
    }
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        logger.warn("SQLiteAdapter.removeAllMemories not implemented", roomId, tableName);
        return Promise.resolve();
    }
    async countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number> {
        logger.warn("SQLiteAdapter.countMemories not implemented", roomId, unique, tableName);
        return 0;
    }
    async getGoals(params: { agentId: UUID; roomId: UUID; userId?: UUID | null; onlyInProgress?: boolean; count?: number; }): Promise<Goal[]> {
        logger.warn("SQLiteAdapter.getGoals not implemented", params);
        return [];
    }
    async updateGoal(goal: Goal): Promise<void> {
        logger.warn("SQLiteAdapter.updateGoal not implemented", goal);
        return Promise.resolve();
    }
    async createGoal(goal: Goal): Promise<void> {
        logger.warn("SQLiteAdapter.createGoal not implemented", goal);
        return Promise.resolve();
    }
    async removeGoal(goalId: UUID): Promise<void> {
        logger.warn("SQLiteAdapter.removeGoal not implemented", goalId);
        return Promise.resolve();
    }
    async removeAllGoals(roomId: UUID): Promise<void> {
        logger.warn("SQLiteAdapter.removeAllGoals not implemented", roomId);
        return Promise.resolve();
    }
    async getRoom(roomId: UUID): Promise<UUID | null> {
        logger.warn("SQLiteAdapter.getRoom not implemented", roomId);
        return null;
    }
    async createRoom(roomId?: UUID): Promise<UUID> {
        logger.warn("SQLiteAdapter.createRoom not implemented", roomId);
        return "00000000-0000-0000-0000-000000000000";
    }
    async removeRoom(roomId: UUID): Promise<void> {
        logger.warn("SQLiteAdapter.removeRoom not implemented", roomId);
        return Promise.resolve();
    }
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        logger.warn("SQLiteAdapter.getRoomsForParticipant not implemented", userId);
        return [];
    }
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        logger.warn("SQLiteAdapter.getRoomsForParticipants not implemented", userIds);
        return [];
    }
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        logger.warn("SQLiteAdapter.addParticipant not implemented", userId, roomId);
        return false;
    }
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        logger.warn("SQLiteAdapter.removeParticipant not implemented", userId, roomId);
        return false;
    }
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        logger.warn("SQLiteAdapter.getParticipantsForAccount not implemented", userId);
        return [];
    }
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        logger.warn("SQLiteAdapter.getParticipantsForRoom not implemented", roomId);
        return [];
    }
    async getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> {
        logger.warn("SQLiteAdapter.getParticipantUserState not implemented", roomId, userId);
        return null;
    }
    async setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void> {
        logger.warn("SQLiteAdapter.setParticipantUserState not implemented", roomId, userId, state);
        return Promise.resolve();
    }
    async createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean> {
        logger.warn("SQLiteAdapter.createRelationship not implemented", params);
        return false;
    }
    async getRelationship(params: { userA: UUID; userB: UUID }): Promise<Relationship | null> {
        logger.warn("SQLiteAdapter.getRelationship not implemented", params);
        return null;
    }
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        logger.warn("SQLiteAdapter.getRelationships not implemented", params);
        return [];
    }
    async getKnowledge(params: { id?: UUID; agentId: UUID; limit?: number; query?: string; conversationContext?: string; }): Promise<RAGKnowledgeItem[]> {
        logger.warn("SQLiteAdapter.getKnowledge not implemented", params);
        return [];
    }
    async searchKnowledge(params: { agentId: UUID; embedding: Float32Array | number[]; match_threshold: number; match_count: number; searchText?: string; }): Promise<RAGKnowledgeItem[]> {
        logger.warn("SQLiteAdapter.searchKnowledge not implemented", params);
        return [];
    }
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        logger.warn("SQLiteAdapter.createKnowledge not implemented", knowledge);
        return Promise.resolve();
    }
    async removeKnowledge(id: UUID): Promise<void> {
        logger.warn("SQLiteAdapter.removeKnowledge not implemented", id);
        return Promise.resolve();
    }
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        logger.warn("SQLiteAdapter.clearKnowledge not implemented", agentId, shared);
        return Promise.resolve();
    }

    // --- Methods for IDatabaseCacheAdapter (stubs for now) ---
    async get(key: string): Promise<string | null> {
        logger.warn("SQLiteAdapter.get (for cache) not implemented", key);
        return null;
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        logger.warn("SQLiteAdapter.set (for cache) not implemented", key, value, ttl);
        return Promise.resolve();
    }

    async delete(key: string): Promise<void> {
        logger.warn("SQLiteAdapter.delete (for cache) not implemented", key);
        return Promise.resolve();
    }

    async clear(namespace?: string): Promise<void> {
        logger.warn("SQLiteAdapter.clear (for cache) not implemented", namespace);
        return Promise.resolve();
    }
}

/**
 * Define the adapter factory
 */
export const adapter = {
    init: (runtime: IAgentRuntime): IDatabaseAdapter => {
        const agentId = runtime.agentId;
        const dbPath = path.join(process.cwd(), 'data', `${agentId}.db`);
        const sqliteAdapter = new SQLiteAdapter(dbPath);
        return sqliteAdapter;
    }
};

// Export a convenience factory to match agent expectations
export async function connect(dbName: string, options?: any) {
    return SQLiteAdapter.connect(dbName, options);
} 