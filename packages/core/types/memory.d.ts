import type { IAgentRuntime, IMemoryManager, Memory, UUID } from './types.js';
/**
 * Manage memories in the database.
 */
export declare class MemoryManager implements IMemoryManager {
    /**
     * The AgentRuntime instance associated with this manager.
     */
    runtime: IAgentRuntime;
    /**
     * The name of the database table this manager operates on.
     */
    tableName: string;
    /**
     * Constructs a new MemoryManager instance.
     * @param opts Options for the manager.
     * @param opts.tableName The name of the table this manager will operate on.
     * @param opts.runtime The AgentRuntime instance associated with this manager.
     */
    constructor(opts: {
        tableName: string;
        runtime: IAgentRuntime;
    });
    /**
     * Adds an embedding vector to a memory object. If the memory already has an embedding, it is returned as is.
     * @param memory The memory object to add an embedding to.
     * @returns A Promise resolving to the memory object, potentially updated with an embedding vector.
     */
    /**
     * Adds an embedding vector to a memory object if one doesn't already exist.
     * The embedding is generated from the memory's text content using the runtime's
     * embedding model. If the memory has no text content, an error is thrown.
     *
     * @param memory The memory object to add an embedding to
     * @returns The memory object with an embedding vector added
     * @throws Error if the memory content is empty
     */
    addEmbeddingToMemory(memory: Memory): Promise<Memory>;
    /**
     * Retrieves a list of memories by user IDs, with optional deduplication.
     * @param opts Options including user IDs, count, and uniqueness.
     * @param opts.roomId The room ID to retrieve memories for.
     * @param opts.count The number of memories to retrieve.
     * @param opts.unique Whether to retrieve unique memories only.
     * @returns A Promise resolving to an array of Memory objects.
     */
    getMemories({ roomId, count, unique, start, end, }: {
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
    /**
     * Searches for memories similar to a given embedding vector.
     * @param embedding The embedding vector to search with.
     * @param opts Options including match threshold, count, user IDs, and uniqueness.
     * @param opts.match_threshold The similarity threshold for matching memories.
     * @param opts.count The maximum number of memories to retrieve.
     * @param opts.roomId The room ID to retrieve memories for.
     * @param opts.unique Whether to retrieve unique memories only.
     * @returns A Promise resolving to an array of Memory objects that match the embedding.
     */
    searchMemoriesByEmbedding(embedding: number[], opts: {
        match_threshold?: number;
        count?: number;
        roomId: UUID;
        unique?: boolean;
    }): Promise<Memory[]>;
    /**
     * Creates a new memory in the database, with an option to check for similarity before insertion.
     * @param memory The memory object to create.
     * @param unique Whether to check for similarity before insertion.
     * @returns A Promise that resolves when the operation completes.
     */
    createMemory(memory: Memory, unique?: boolean): Promise<void>;
    getMemoriesByRoomIds(params: {
        roomIds: UUID[];
        limit?: number;
    }): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    /**
     * Removes a memory from the database by its ID.
     * @param memoryId The ID of the memory to remove.
     * @returns A Promise that resolves when the operation completes.
     */
    removeMemory(memoryId: UUID): Promise<void>;
    /**
     * Removes all memories associated with a set of user IDs.
     * @param roomId The room ID to remove memories for.
     * @returns A Promise that resolves when the operation completes.
     */
    removeAllMemories(roomId: UUID): Promise<void>;
    /**
     * Counts the number of memories associated with a set of user IDs, with an option for uniqueness.
     * @param roomId The room ID to count memories for.
     * @param unique Whether to count unique memories only.
     * @returns A Promise resolving to the count of memories.
     */
    countMemories(roomId: UUID, unique?: boolean): Promise<number>;
}
