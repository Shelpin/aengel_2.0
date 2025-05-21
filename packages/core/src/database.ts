import { IDatabaseAdapter, Memory, Goal, GoalStatus, Actor, Relationship, RAGKnowledgeItem, UUID } from "./types.js";
import { elizaLogger as logger } from "./logger.js";

/**
 * Base database adapter implementation
 */
export abstract class DatabaseAdapter<DB = any> implements IDatabaseAdapter {
    protected db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    /**
     * Connects to the database
     */
    connect(): Promise<void> {
        logger.info("Connecting to database");
        return Promise.resolve();
    }

    /**
     * Disconnects from the database
     */
    disconnect(): Promise<void> {
        logger.info("Disconnecting from database");
        return Promise.resolve();
    }

    /**
     * Executes a query
     */
    query(sql: string, params?: any[]): Promise<any[]> {
        logger.debug("Executing query", { sql, params });
        return Promise.resolve([]);
    }

    /**
     * Creates a new participant
     */
    createParticipant(userId: UUID, roomId: UUID, metadata?: any): Promise<boolean> {
        logger.debug("Creating participant", { userId, roomId });
        return Promise.resolve(true);
    }

    /**
     * Removes a participant
     */
    removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        logger.debug("Removing participant", { userId, roomId });
        return Promise.resolve(true);
    }

    // Remove abstract keyword and provide concrete implementations for methods required by IDatabaseAdapter
    getAccountById(userId: UUID): Promise<any | null> { logger.debug('getAccountById called', { userId }); return Promise.resolve(null); }
    createAccount(account: any): Promise<boolean> { logger.debug('createAccount called', { account }); return Promise.resolve(false); }
    getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]> { logger.debug('getMemories called', params); return Promise.resolve([]); }
    getMemoryById(id: UUID): Promise<Memory | null> { logger.debug('getMemoryById called', { id }); return Promise.resolve(null); }
    getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]> { logger.debug('getMemoriesByIds called', { ids, tableName }); return Promise.resolve([]); }
    getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]> { logger.debug('getMemoriesByRoomIds called', params); return Promise.resolve([]); }
    getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number }[]> { logger.debug('getCachedEmbeddings called', params); return Promise.resolve([]); }
    log(params: { body: { [key: string]: unknown }; userId: UUID; roomId: UUID; type: string; }): Promise<void> { logger.debug('log called', params); return Promise.resolve(); }
    getActorDetails(params: { roomId: UUID }): Promise<Actor[]> { logger.debug('getActorDetails called', params); return Promise.resolve([]); }
    searchMemories(params: { tableName: string; agentId: UUID; roomId: UUID; embedding: number[]; match_threshold: number; match_count: number; unique: boolean; }): Promise<Memory[]> { logger.debug('searchMemories called', params); return Promise.resolve([]); }
    updateGoalStatus(params: { goalId: UUID; status: GoalStatus; }): Promise<void> { logger.debug('updateGoalStatus called', params); return Promise.resolve(); }
    searchMemoriesByEmbedding(embedding: number[], params: { match_threshold?: number; count?: number; roomId?: UUID; agentId?: UUID; unique?: boolean; tableName: string; }): Promise<Memory[]> { logger.debug('searchMemoriesByEmbedding called', { embedding, params }); return Promise.resolve([]); }
    createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void> { logger.debug('createMemory called', { memory, tableName, unique }); return Promise.resolve(); }
    removeMemory(memoryId: UUID, tableName: string): Promise<void> { logger.debug('removeMemory called', { memoryId, tableName }); return Promise.resolve(); }
    removeAllMemories(roomId: UUID, tableName: string): Promise<void> { logger.debug('removeAllMemories called', { roomId, tableName }); return Promise.resolve(); }
    countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number> { logger.debug('countMemories called', { roomId, unique, tableName }); return Promise.resolve(0); }
    getGoals(params: { agentId: UUID; roomId: UUID; userId?: UUID | null; onlyInProgress?: boolean; count?: number; }): Promise<Goal[]> { logger.debug('getGoals called', params); return Promise.resolve([]); }
    updateGoal(goal: Goal): Promise<void> { logger.debug('updateGoal called', { goal }); return Promise.resolve(); }
    createGoal(goal: Goal): Promise<void> { logger.debug('createGoal called', { goal }); return Promise.resolve(); }
    removeGoal(goalId: UUID): Promise<void> { logger.debug('removeGoal called', { goalId }); return Promise.resolve(); }
    removeAllGoals(roomId: UUID): Promise<void> { logger.debug('removeAllGoals called', { roomId }); return Promise.resolve(); }
    getRoom(roomId: UUID): Promise<UUID | null> { logger.debug('getRoom called', { roomId }); return Promise.resolve(null); }
    createRoom(roomId?: UUID): Promise<UUID> { logger.debug('createRoom called', { roomId }); return Promise.resolve(roomId || 'generated-uuid'); }
    removeRoom(roomId: UUID): Promise<void> { logger.debug('removeRoom called', { roomId }); return Promise.resolve(); }
    getRoomsForParticipant(userId: UUID): Promise<UUID[]> { logger.debug('getRoomsForParticipant called', { userId }); return Promise.resolve([]); }
    getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> { logger.debug('getRoomsForParticipants called', { userIds }); return Promise.resolve([]); }
    addParticipant(userId: UUID, roomId: UUID): Promise<boolean> { logger.debug('addParticipant called', { userId, roomId }); return Promise.resolve(false); }
    getParticipantsForAccount(userId: UUID): Promise<any[]> { logger.debug('getParticipantsForAccount called', { userId }); return Promise.resolve([]); }
    getParticipantsForRoom(roomId: UUID): Promise<UUID[]> { logger.debug('getParticipantsForRoom called', { roomId }); return Promise.resolve([]); }
    getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> { logger.debug('getParticipantUserState called', { roomId, userId }); return Promise.resolve(null); }
    setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void> { logger.debug('setParticipantUserState called', { roomId, userId, state }); return Promise.resolve(); }
    createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean> { logger.debug('createRelationship called', params); return Promise.resolve(false); }
    getRelationship(params: { userA: UUID; userB: UUID }): Promise<Relationship | null> { logger.debug('getRelationship called', params); return Promise.resolve(null); }
    getRelationships(params: { userId: UUID }): Promise<Relationship[]> { logger.debug('getRelationships called', params); return Promise.resolve([]); }
    getKnowledge(params: { id?: UUID; agentId: UUID; limit?: number; query?: string; conversationContext?: string; }): Promise<RAGKnowledgeItem[]> { logger.debug('getKnowledge called', params); return Promise.resolve([]); }
    searchKnowledge(params: { agentId: UUID; embedding: Float32Array | number[]; match_threshold: number; match_count: number; searchText?: string; }): Promise<RAGKnowledgeItem[]> { logger.debug('searchKnowledge called', params); return Promise.resolve([]); }
    createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> { logger.debug('createKnowledge called', { knowledge }); return Promise.resolve(); }
    removeKnowledge(id: UUID): Promise<void> { logger.debug('removeKnowledge called', { id }); return Promise.resolve(); }
    clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> { logger.debug('clearKnowledge called', { agentId, shared }); return Promise.resolve(); }
} 