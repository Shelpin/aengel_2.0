import path from "node:path";
import type { Database } from "better-sqlite3";
import { type UUID, type Memory, type Goal, type GoalStatus, type Actor, type Relationship, type RAGKnowledgeItem, type Account, type Participant, type IAgentRuntime, type IDatabaseAdapter } from "@elizaos/core";

/**
 * Simple SQLite adapter class that implements the required interfaces
 */
export class SQLiteAdapter implements IDatabaseAdapter {
    dbPath: string;
    private connected: boolean = false;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Connect to a SQLite database
     */
    static async connect(dbName: string, options = {}): Promise<SQLiteAdapter> {
        const dbPath = typeof dbName === 'string'
            ? dbName
            : ':memory:';
        const adapter = new SQLiteAdapter(dbPath);
        await adapter.connect();
        return adapter;
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        this.connected = true;
        console.log(`Connected to SQLite database: ${this.dbPath}`);
        // TODO: Implement actual connection logic if using a library like better-sqlite3
        return Promise.resolve();
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        this.connected = false;
        console.log(`Disconnected from SQLite database: ${this.dbPath}`);
        // TODO: Implement actual disconnection logic
        return Promise.resolve();
    }

    /**
     * Execute a query
     */
    async query(sql: string, params: any[] = []): Promise<any[]> {
        console.log(`Executing query (stub): ${sql}`, params);
        if (!this.connected) {
            console.error("Database not connected");
            return Promise.reject(new Error("Database not connected"));
        }
        // TODO: Implement actual query execution
        return Promise.resolve([]);
    }

    // --- STUB IMPLEMENTATIONS for IDatabaseAdapter --- 

    async getAccountById(userId: UUID): Promise<Account | null> {
        console.warn("SQLiteAdapter.getAccountById not implemented");
        return null;
    }
    async createAccount(account: Account): Promise<boolean> {
        console.warn("SQLiteAdapter.createAccount not implemented", account);
        return false;
    }
    async getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]> {
        console.warn("SQLiteAdapter.getMemories not implemented", params);
        return [];
    }
    async getMemoryById(id: UUID): Promise<Memory | null> {
        console.warn("SQLiteAdapter.getMemoryById not implemented", id);
        return null;
    }
    async getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]> {
        console.warn("SQLiteAdapter.getMemoriesByIds not implemented", ids, tableName);
        return [];
    }
    async getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]> {
        console.warn("SQLiteAdapter.getMemoriesByRoomIds not implemented", params);
        return [];
    }
    async getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
        console.warn("SQLiteAdapter.getCachedEmbeddings not implemented", params);
        return [];
    }
    async log(params: { body: { [key: string]: unknown }; userId: UUID; roomId: UUID; type: string; }): Promise<void> {
        console.warn("SQLiteAdapter.log not implemented", params);
        return Promise.resolve();
    }
    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        console.warn("SQLiteAdapter.getActorDetails not implemented", params);
        return [];
    }
    async searchMemories(params: { tableName: string; agentId: UUID; roomId: UUID; embedding: number[]; match_threshold: number; match_count: number; unique: boolean; }): Promise<Memory[]> {
        console.warn("SQLiteAdapter.searchMemories not implemented", params);
        return [];
    }
    async updateGoalStatus(params: { goalId: UUID; status: GoalStatus; }): Promise<void> {
        console.warn("SQLiteAdapter.updateGoalStatus not implemented", params);
        return Promise.resolve();
    }
    async searchMemoriesByEmbedding(embedding: number[], params: { match_threshold?: number; count?: number; roomId?: UUID; agentId?: UUID; unique?: boolean; tableName: string; }): Promise<Memory[]> {
        console.warn("SQLiteAdapter.searchMemoriesByEmbedding not implemented", embedding, params);
        return [];
    }
    async createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void> {
        console.warn("SQLiteAdapter.createMemory not implemented", memory, tableName, unique);
        return Promise.resolve();
    }
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        console.warn("SQLiteAdapter.removeMemory not implemented", memoryId, tableName);
        return Promise.resolve();
    }
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        console.warn("SQLiteAdapter.removeAllMemories not implemented", roomId, tableName);
        return Promise.resolve();
    }
    async countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number> {
        console.warn("SQLiteAdapter.countMemories not implemented", roomId, unique, tableName);
        return 0;
    }
    async getGoals(params: { agentId: UUID; roomId: UUID; userId?: UUID | null; onlyInProgress?: boolean; count?: number; }): Promise<Goal[]> {
        console.warn("SQLiteAdapter.getGoals not implemented", params);
        return [];
    }
    async updateGoal(goal: Goal): Promise<void> {
        console.warn("SQLiteAdapter.updateGoal not implemented", goal);
        return Promise.resolve();
    }
    async createGoal(goal: Goal): Promise<void> {
        console.warn("SQLiteAdapter.createGoal not implemented", goal);
        return Promise.resolve();
    }
    async removeGoal(goalId: UUID): Promise<void> {
        console.warn("SQLiteAdapter.removeGoal not implemented", goalId);
        return Promise.resolve();
    }
    async removeAllGoals(roomId: UUID): Promise<void> {
        console.warn("SQLiteAdapter.removeAllGoals not implemented", roomId);
        return Promise.resolve();
    }
    async getRoom(roomId: UUID): Promise<UUID | null> {
        console.warn("SQLiteAdapter.getRoom not implemented", roomId);
        return null;
    }
    async createRoom(roomId?: UUID): Promise<UUID> {
        console.warn("SQLiteAdapter.createRoom not implemented", roomId);
        // Returning a placeholder UUID - actual implementation needed
        return "00000000-0000-0000-0000-000000000000";
    }
    async removeRoom(roomId: UUID): Promise<void> {
        console.warn("SQLiteAdapter.removeRoom not implemented", roomId);
        return Promise.resolve();
    }
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        console.warn("SQLiteAdapter.getRoomsForParticipant not implemented", userId);
        return [];
    }
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        console.warn("SQLiteAdapter.getRoomsForParticipants not implemented", userIds);
        return [];
    }
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        console.warn("SQLiteAdapter.addParticipant not implemented", userId, roomId);
        return false;
    }
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        console.warn("SQLiteAdapter.removeParticipant not implemented", userId, roomId);
        return false;
    }
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        console.warn("SQLiteAdapter.getParticipantsForAccount not implemented", userId);
        return [];
    }
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        console.warn("SQLiteAdapter.getParticipantsForRoom not implemented", roomId);
        return [];
    }
    async getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> {
        console.warn("SQLiteAdapter.getParticipantUserState not implemented", roomId, userId);
        return null;
    }
    async setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void> {
        console.warn("SQLiteAdapter.setParticipantUserState not implemented", roomId, userId, state);
        return Promise.resolve();
    }
    async createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean> {
        console.warn("SQLiteAdapter.createRelationship not implemented", params);
        return false;
    }
    async getRelationship(params: { userA: UUID; userB: UUID }): Promise<Relationship | null> {
        console.warn("SQLiteAdapter.getRelationship not implemented", params);
        return null;
    }
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        console.warn("SQLiteAdapter.getRelationships not implemented", params);
        return [];
    }
    async getKnowledge(params: { id?: UUID; agentId: UUID; limit?: number; query?: string; conversationContext?: string; }): Promise<RAGKnowledgeItem[]> {
        console.warn("SQLiteAdapter.getKnowledge not implemented", params);
        return [];
    }
    async searchKnowledge(params: { agentId: UUID; embedding: Float32Array | number[]; match_threshold: number; match_count: number; searchText?: string; }): Promise<RAGKnowledgeItem[]> {
        console.warn("SQLiteAdapter.searchKnowledge not implemented", params);
        return [];
    }
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        console.warn("SQLiteAdapter.createKnowledge not implemented", knowledge);
        return Promise.resolve();
    }
    async removeKnowledge(id: UUID): Promise<void> {
        console.warn("SQLiteAdapter.removeKnowledge not implemented", id);
        return Promise.resolve();
    }
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        console.warn("SQLiteAdapter.clearKnowledge not implemented", agentId, shared);
        return Promise.resolve();
    }

    // --- END STUB IMPLEMENTATIONS ---

    async get(key: string): Promise<string | null> {
        console.warn("SQLiteAdapter.get not implemented", key);
        return null;
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        console.warn("SQLiteAdapter.set not implemented", key, value, ttl);
        return Promise.resolve();
    }

    async delete(key: string): Promise<void> {
        console.warn("SQLiteAdapter.delete not implemented", key);
        return Promise.resolve();
    }

    async clear(namespace?: string): Promise<void> {
        console.warn("SQLiteAdapter.clear not implemented", namespace);
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
        // TODO: Consider if connect should be called here or if the consumer is responsible
        // await sqliteAdapter.connect(); 
        return sqliteAdapter;
    }
};

// Export a convenience factory to match agent expectations
// This function seems like a duplicate of the static connect method in the class, 
// and also uses IDatabaseAdapter and IAgentRuntime which are causing issues.
// For now, I will comment it out to resolve immediate build errors.
// If this is intended to be used, it needs to be refactored to use CoreDatabaseAdapter and import IAgentRuntime correctly.
/*
export async function connect(dbName: string, options?: any) {
    const dbPath = path.join(process.cwd(), 'data', dbName);
    const db = new SQLiteAdapter(dbPath);
    await db.connect(); 
    return db;
}
*/

// Example of how to use IAgentRuntime if needed elsewhere, assuming it's for a function not a class method here
// function exampleFunctionWithRuntime(runtime: IAgentRuntime, dbAdapter: IDatabaseAdapter) {
//    console.log("Agent ID:", runtime.agentId);
//    console.log("DB Adapter path (if SQLiteAdapter):", (dbAdapter as SQLiteAdapter).dbPath); // Type assertion might be needed
// }

// Export a convenience factory to match agent expectations
export async function connect(dbName: string, options?: any) {
    return SQLiteAdapter.connect(dbName, options);
} 