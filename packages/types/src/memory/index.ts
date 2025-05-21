/**
 * Memory interface definitions
 */

// Empty export to avoid circular dependencies
export { };

import { UUID } from '../common/index.js';

// Memory content structure
export interface MemoryContent {
    text: string;
    [key: string]: any;
}

// Memory entry
export interface Memory {
    id: UUID;
    agentId?: UUID;
    roomId?: UUID;
    content: MemoryContent;
    embedding?: number[];
    timestamp: number;
    type: string;
    metadata?: Record<string, any>;
}

// Memory query options
export interface MemoryQueryOptions {
    limit?: number;
    offset?: number;
    type?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
    orderBy?: 'timestamp' | 'id';
    order?: 'asc' | 'desc';
}

// Memory manager interface
export interface IMemoryManager {
    addEmbeddingToMemory(memory: Memory): Promise<Memory>;
    getMemories(opts: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        start?: number;
        end?: number;
    }): Promise<Memory[]>;
    getCachedEmbeddings(content: string): Promise<{
        embedding: number[];
        levenshtein_score: number;
    }[]>;
    searchMemoriesByEmbedding(
        embedding: number[],
        opts: {
            match_threshold?: number;
            count?: number;
            roomId: UUID;
            unique?: boolean;
        }
    ): Promise<Memory[]>;
    createMemory(memory: Memory, unique?: boolean): Promise<void>;
    getMemoriesByRoomIds(params: { roomIds: UUID[]; limit?: number }): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    removeMemory(memoryId: UUID): Promise<void>;
    removeAllMemories(roomId: UUID): Promise<void>;
    countMemories(roomId: UUID, unique?: boolean): Promise<number>;
}

// Memory storage interface
export interface MemoryStorage {
    /**
     * Store a memory
     */
    store(memory: Omit<Memory, 'id'>): Promise<Memory>;

    /**
     * Retrieve a memory by ID
     */
    retrieve(id: UUID): Promise<Memory | null>;

    /**
     * Query memories
     */
    query(options: MemoryQueryOptions): Promise<Memory[]>;

    /**
     * Update a memory
     */
    update(id: UUID, updates: Partial<Omit<Memory, 'id'>>): Promise<Memory | null>;

    /**
     * Delete a memory
     */
    delete(id: UUID): Promise<boolean>;

    /**
     * Clear all memories
     */
    clear(): Promise<void>;
} 