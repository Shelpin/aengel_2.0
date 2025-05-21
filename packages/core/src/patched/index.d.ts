/**
 * Common types for ElizaOS
 */
/**
 * UUID type used across ElizaOS
 */
export type UUID = string;
/**
 * Memory interface for storing agent memories
 */
export interface MemoryContent {
    text: string;
    action?: string;
    attachments?: any[];
    [key: string]: any;
}
export interface Memory {
    id: string;
    roomId: string;
    senderId: string;
    content: MemoryContent;
    createdAt?: number;
    embedding?: number[];
    [key: string]: any;
}
/**
 * Basic database adapter interface
 */
export interface DatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    close(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
    execute(sql: string, params?: any[]): Promise<void>;
    getParticipantsForRoom(roomId: UUID): Promise<UUID[]>;
    getParticipantsForAccount(userId: UUID): Promise<any[]>;
    addParticipant(userId: UUID, roomId: UUID): Promise<boolean>;
    getRoom(roomId: UUID): Promise<any | null>;
    createRoom(roomId?: UUID): Promise<UUID>;
    getAccountById(userId: UUID): Promise<any | null>;
    createAccount(account: any): Promise<boolean>;
    getMemories(params: any): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]>;
    getMemoriesByRoomIds(params: any): Promise<Memory[]>;
    getCachedEmbeddings(params: any): Promise<any[]>;
    searchMemories(params: any): Promise<Memory[]>;
    createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void>;
    removeMemory(memoryId: UUID, tableName: string): Promise<void>;
    removeAllMemories(roomId: UUID, tableName: string): Promise<void>;
    countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number>;
    getGoals(params: any): Promise<any[]>;
    updateGoal(goal: any): Promise<void>;
    createGoal(goal: any): Promise<void>;
    createRelationship(params: any): Promise<boolean>;
    getRelationship(params: any): Promise<any | null>;
    getRelationships(params: any): Promise<any[]>;
    getKnowledge(params: any): Promise<any[]>;
    searchKnowledge(params: any): Promise<any[]>;
    createKnowledge(knowledge: any): Promise<void>;
    removeKnowledge(id: UUID): Promise<void>;
    clearKnowledge(agentId: UUID, shared?: boolean): Promise<void>;
    log(params: any): Promise<void>;
}
/**
 * Database cache adapter interface
 */
export interface DatabaseCacheAdapter {
    getCache(params: {
        key: string;
        agentId: string;
    }): Promise<string | undefined>;
    setCache(params: {
        key: string;
        agentId: string;
        value: string;
    }): Promise<boolean>;
    deleteCache(params: {
        key: string;
        agentId: string;
    }): Promise<boolean>;
}
/**
 * Vector database adapter interface
 */
export interface VectorDatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    storeEmbedding(key: string, embedding: number[], metadata?: any): Promise<void>;
    searchSimilar(query: number[], limit?: number): Promise<any[]>;
}
/**
 * Agent runtime interface
 */
export interface IAgentRuntime {
    agentId: UUID;
    serverUrl: string;
    databaseAdapter: DatabaseAdapter;
    token: string | null;
    modelProvider: ModelProviderName;
    imageModelProvider: ModelProviderName;
    imageVisionModelProvider: ModelProviderName;
    character: any;
    providers: any[];
    actions: any[];
    evaluators: any[];
    plugins: any[];
    fetch?: typeof fetch | null;
    messageManager: any;
    descriptionManager: any;
    documentsManager: any;
    knowledgeManager: any;
    ragKnowledgeManager: any;
    loreManager: any;
    cacheManager: any;
    services: Map<string, any>;
    clients: any[];
    initialize(): Promise<void>;
    registerMemoryManager(manager: any): void;
    getMemoryManager(name: string): any | null;
    getService<T>(service: string): T | null;
    registerService(service: any): void;
    getSetting(key: string): string | null;
    getConversationLength(): number;
    processActions(message: Memory, responses: Memory[], state?: any, callback?: any): Promise<void>;
    evaluate(message: Memory, state?: any, didRespond?: boolean, callback?: any): Promise<string[] | null>;
    ensureParticipantExists(userId: string, roomId: string): Promise<void>;
    ensureUserExists(userId: string, userName: string | null, name: string | null, source?: string | null): Promise<void>;
    registerAction(action: any): void;
    ensureConnection(userId: string, roomId: string, userName?: string, userScreenName?: string, source?: string): Promise<void>;
    ensureParticipantInRoom(userId: string, roomId: string): Promise<void>;
    ensureRoomExists(roomId: string): Promise<void>;
    composeState(message: Memory, additionalKeys?: {
        [key: string]: unknown;
    }): Promise<any>;
    updateRecentMessageState(state: any): Promise<any>;
}
/**
 * Goal interface for agents
 */
export interface Goal {
    id: UUID;
    agentId: UUID;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    priority: number;
    createdAt: number;
    completedAt?: number;
    metadata?: Record<string, any>;
}
export type Actor = {
    id: UUID;
    name: string;
    username?: string;
};
export interface State {
    roomId: UUID;
    agentName: string;
    senderName: string;
    actors: string;
    actorsData: Actor[];
    goals: string;
    goalsData: any[];
    recentMessages: string;
    recentMessagesData: Memory[];
    knowledge?: string;
    ragKnowledgeData?: any[];
    [key: string]: any;
}
export type HandlerCallback = (result: any) => void;
export * from './database/adapter.js';
/**
 * Model provider types
 */
export declare enum ModelProviderName {
    OPENAI = "openai",
    ETERNALAI = "eternalai",
    ANTHROPIC = "anthropic",
    GROK = "grok",
    GROQ = "groq",
    LLAMACLOUD = "llama_cloud",
    TOGETHER = "together",
    LLAMALOCAL = "llama_local",
    LMSTUDIO = "lmstudio",
    GOOGLE = "google",
    MISTRAL = "mistral",
    CLAUDE_VERTEX = "claude_vertex",
    REDPILL = "redpill",
    OPENROUTER = "openrouter",
    OLLAMA = "ollama",
    HEURIST = "heurist",
    GALADRIEL = "galadriel",
    FAL = "falai",
    GAIANET = "gaianet",
    ALI_BAILIAN = "ali_bailian",
    VOLENGINE = "volengine",
    NANOGPT = "nanogpt",
    HYPERBOLIC = "hyperbolic",
    VENICE = "venice",
    NVIDIA = "nvidia",
    NINETEEN_AI = "nineteen_ai",
    AKASH_CHAT_API = "akash_chat_api",
    LIVEPEER = "livepeer",
    LETZAI = "letzai",
    DEEPSEEK = "deepseek",
    INFERA = "infera",
    BEDROCK = "bedrock",
    ATOMA = "atoma",
    SECRETAI = "secret_ai",
    NEARAI = "nearai"
}
/**
 * Model class types
 */
export declare enum ModelClass {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    EMBEDDING = "embedding",
    IMAGE = "image"
}
/**
 * Memory manager interface
 */
export interface IMemoryManager {
    runtime: IAgentRuntime;
    tableName: string;
    constructor: Function;
    addEmbeddingToMemory(memory: Memory): Promise<Memory>;
    getMemories(opts: {
        roomId: string;
        count?: number;
        unique?: boolean;
        start?: number;
        end?: number;
    }): Promise<Memory[]>;
    getCachedEmbeddings(content: string): Promise<{
        embedding: number[];
        levenshtein_score: number;
    }[]>;
    getMemoryById(id: string): Promise<Memory | null>;
    getMemoriesByRoomIds(params: {
        roomIds: string[];
        limit?: number;
    }): Promise<Memory[]>;
    searchMemoriesByEmbedding(embedding: number[], opts: {
        match_threshold?: number;
        count?: number;
        roomId: string;
        unique?: boolean;
    }): Promise<Memory[]>;
    createMemory(memory: Memory, unique?: boolean): Promise<void>;
    removeMemory(memoryId: string): Promise<void>;
    removeAllMemories(roomId: string): Promise<void>;
    countMemories(roomId: string, unique?: boolean): Promise<number>;
}
//# sourceMappingURL=index.d.ts.map