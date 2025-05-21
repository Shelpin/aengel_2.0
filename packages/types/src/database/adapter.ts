import { Memory, UUID } from '../index.js';

/**
 * Database cache adapter interface
 */
export interface DatabaseCacheAdapter {
    getCache(params: { key: string; agentId: string }): Promise<string | undefined>;
    setCache(params: { key: string; agentId: string; value: string }): Promise<boolean>;
    deleteCache(params: { key: string; agentId: string }): Promise<boolean>;
}

/**
 * Database adapter type 
 */
export type Adapter = {
    /** Initialize the adapter */
    init: (runtime: any) => DatabaseAdapter & DatabaseCacheAdapter;
};

/**
 * Database adapter interface
 */
export interface DatabaseAdapter {
    // Connection methods
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    close(): Promise<void>;

    // General query methods
    query(sql: string, params?: any[]): Promise<any[]>;
    execute(sql: string, params?: any[]): Promise<void>;

    // Participants and rooms
    getParticipantsForRoom(roomId: string): Promise<string[]>;
    getParticipantsForAccount(userId: string): Promise<any[]>;
    addParticipant(userId: string, roomId: string): Promise<boolean>;
    getRoom(roomId: string): Promise<any | null>;
    createRoom(roomId?: string): Promise<string>;

    // Accounts
    getAccountById(userId: string): Promise<any | null>;
    createAccount(account: any): Promise<boolean>;

    // Memories
    getMemories(params: any): Promise<Memory[]>;
    getMemoryById(id: string): Promise<Memory | null>;
    getMemoriesByIds(ids: string[], tableName?: string): Promise<Memory[]>;
    getMemoriesByRoomIds(params: any): Promise<Memory[]>;
    getCachedEmbeddings(params: any): Promise<any[]>;
    searchMemories(params: any): Promise<Memory[]>;
    createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void>;
    removeMemory(memoryId: string, tableName: string): Promise<void>;
    removeAllMemories(roomId: string, tableName: string): Promise<number>;
    countMemories(roomId: string, unique?: boolean, tableName?: string): Promise<number>;

    // Goals
    getGoals(params: any): Promise<any[]>;
    updateGoal(goal: any): Promise<void>;
    createGoal(goal: any): Promise<void>;

    // Relationships
    createRelationship(params: any): Promise<boolean>;
    getRelationship(params: any): Promise<any | null>;
    getRelationships(params: any): Promise<any[]>;

    // Knowledge
    getKnowledge(params: any): Promise<any[]>;
    searchKnowledge(params: any): Promise<any[]>;
    createKnowledge(knowledge: any): Promise<void>;
    removeKnowledge(id: string): Promise<void>;
    clearKnowledge(agentId: string, shared?: boolean): Promise<void>;

    // Other methods
    log(params: any): Promise<void>;
} 