/**
 * This file centralizes all type definitions for @elizaos/core.
 * It includes types previously in packages/types and core-specific types.
 */
import type { Readable } from "node:stream";
import { UUID } from "./uuid.js";
export type { UUID };

// --- Core-specific types ---
export interface CoreInternalConfig {
    someCoreSetting: boolean;
}

export type ModelSettings = {
    name: string;
    maxInputTokens: number;
    maxOutputTokens: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    stop: string[];
    temperature: number;
    experimental_telemetry?: any;
};
export type ImageModelSettings = {
    name: string;
    steps?: number;
};
export type EmbeddingModelSettings = {
    name: string;
    dimensions?: number;
};
export type Model = {
    endpoint?: string;
    model: {
        small?: ModelSettings;
        medium?: ModelSettings;
        large?: ModelSettings;
        embedding?: EmbeddingModelSettings;
        image?: ImageModelSettings;
        [key: string]: ModelSettings | EmbeddingModelSettings | ImageModelSettings | undefined;
    };
};
export type Models = {
    [key: string]: Model;
};

export type TemplateType = string | ((options: { state: any /* Placeholder for State */ }) => string);

// --- Types migrated from packages/types/src/index.ts ---

// export type UUID = string; // Removed to avoid conflict with uuid.ts
export type GoalStatus = 'DONE' | 'FAILED' | 'IN_PROGRESS';

export interface ClientConfig {
  name: string;
  [key: string]: unknown;
}

export interface PluginConfig {
  name: string;
  [key: string]: unknown;
}

// Forward declaration for Character used in PostProcessor and other types
// export interface Character {} // This was a forward declaration, main one is below

export interface PostProcessor {
  name?: string;
  handlePostCharacterLoaded?: (character: Character) => Promise<Character>;
}

export interface CharacterSettings {
  OPENAI_MODEL_NAME?: string;
  SMALL_OPENAI_MODEL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  secrets?: { [key: string]: any };
  [key: string]: any;
}

export interface CharacterStyle {
  all?: string[];
  chat?: string[];
  post?: string[];
  [key: string]: any;
}

export interface MessageContent {
  text: string;
  [key: string]: any;
}

/*
// MessageTurn is a multi-agent artifact, commented out for single-agent refactor
export interface MessageTurn {
  user: string;
  content: MessageContent;
}
*/

/*
// MessageExample depends on MessageTurn, commented out
export type MessageExample = MessageTurn[];
*/

export interface Character {
  id?: string;
  name: string;
  username?: string;
  modelProvider: ModelProviderName;
  clients: (string | ClientConfig)[];
  plugins?: (string | PluginConfig)[];
  postProcessors?: PostProcessor[];
  settings?: CharacterSettings;
  system?: string;
  bio?: string | string[];
  lore?: string[];
  knowledge?: string[];
  // messageExamples?: (MessageTurn[])[][]; // Commented out as MessageTurn is removed for now
  postExamples?: string[];
  topics?: string[];
  adjectives?: string[];
  style?: CharacterStyle;
  cache?: CacheOptions;
  evaluators?: Evaluator[];
  actions?: Action[];
  modelEndpointOverride?: string;
  description?: string;
  traits?: string[];
  interests?: string[];
  templates?: any;
}

export type Provider = any;
export type Relationship = any;
export type RAGKnowledgeItem = any;
export type Logger = any;
export type FetchFunction = (...args: any[]) => Promise<any>;
export type Objective = any;
export type TextGenerationResponse = any;

export interface Account {
    id: UUID;
    userId: UUID;
    provider: string;
    providerAccountId: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface Participant {
    userId: UUID;
    roomId: UUID;
    status: 'active' | 'inactive' | 'invited' | 'left';
    joinedAt?: number;
    lastSeenAt?: number;
    metadata?: Record<string, any>;
}

export interface Media {
    id: UUID;
    url: string;
    type: 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'voice';
    mimeType?: string;
    size?: number;
    metadata?: Record<string, any>;
    createdAt?: number;
}

export interface ClientInstance {
    start(): Promise<void>;
    stop(): Promise<void>;
    sendMessage(message: any): Promise<any>;
    name?: string; // Added to allow runtime to identify client by name
}

export interface Client {
    id?: UUID;
    name: string;
    type?: string;
    config: Record<string, any>;
    instance?: ClientInstance;
    status?: 'running' | 'stopped' | 'error';
    start?: (runtime: IAgentRuntime) => Promise<ClientInstance>;
    stop?: () => Promise<void>;
}

export type Adapter = any;

export interface PluginContext {
    runtime: IAgentRuntime;
}
export interface Plugin {
    name: string;
    version?: string;
    clients?: Client[];
    initialize?(context: PluginContext): Promise<void>;
    shutdown?(): Promise<void>;
    capabilities?: string[];
    isDatabaseAdapter?: boolean; // Added for findDatabaseAdapter logic
}

export type Service = any;

export interface ActionParameters {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        description: string;
        required?: boolean;
    };
}

export interface Action {
    name: string;
    description: string;
    parameters?: ActionParameters;
    execute: (params: Record<string, any>, context: any) => Promise<any>;
    suppressInitialMessage?: boolean;
    examples?: any[]; // Was ActionExample[], changed to any[] as ActionExample depends on MessageTurn
}

export type ActionExample = any; // Was Placeholder, now directly any as it depended on MessageTurn
export type Evaluator = any;
export type EvaluationExample = any;
export type Handler = any;
export type Validator = any;
export type State = any;
export type Content = any;
export type CacheOptions = any;
export type ICacheManager = any;
export type IRAGKnowledgeManager = any;
export type KnowledgeItem = any;
export type ActionResponse = any;
export type DirectoryItem = any;
export type ChunkRow = any;

export enum ServiceType { PLACEHOLDER = "PLACEHOLDER" }
export enum LoggingLevel { PLACEHOLDER = "PLACEHOLDER" }
export enum TokenizerType { PLACEHOLDER = "PLACEHOLDER" }
export enum TranscriptionProvider { PLACEHOLDER = "PLACEHOLDER" }
export enum ActionTimelineType { PLACEHOLDER = "PLACEHOLDER" }
export enum KnowledgeScope {
    AGENT = 'agent',
    GLOBAL = 'global',
    SHARED = 'shared',
    PRIVATE = 'private'
}
export enum CacheKeyPrefix { PLACEHOLDER = "PLACEHOLDER" }

export interface IDatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
    getAccountById(userId: UUID): Promise<any | null>;
    createAccount(account: any): Promise<boolean>;
    getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]>;
    getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]>;
    getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number }[]>;
    log(params: { body: { [key: string]: unknown }; userId: UUID; roomId: UUID; type: string; }): Promise<void>;
    getActorDetails(params: { roomId: UUID }): Promise<Actor[]>;
    searchMemories(params: { tableName: string; agentId: UUID; roomId: UUID; embedding: number[]; match_threshold: number; match_count: number; unique: boolean; }): Promise<Memory[]>;
    updateGoalStatus(params: { goalId: UUID; status: GoalStatus; }): Promise<void>;
    searchMemoriesByEmbedding(embedding: number[], params: { match_threshold?: number; count?: number; roomId?: UUID; agentId?: UUID; unique?: boolean; tableName: string; }): Promise<Memory[]>;
    createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void>;
    removeMemory(memoryId: UUID, tableName: string): Promise<void>;
    removeAllMemories(roomId: UUID, tableName: string): Promise<void>;
    countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number>;
    getGoals(params: { agentId: UUID; roomId: UUID; userId?: UUID | null; onlyInProgress?: boolean; count?: number; }): Promise<Goal[]>;
    updateGoal(goal: Goal): Promise<void>;
    createGoal(goal: Goal): Promise<void>;
    removeGoal(goalId: UUID): Promise<void>;
    removeAllGoals(roomId: UUID): Promise<void>;
    getRoom(roomId: UUID): Promise<UUID | null>;
    createRoom(roomId?: UUID): Promise<UUID>;
    removeRoom(roomId: UUID): Promise<void>;
    getRoomsForParticipant(userId: UUID): Promise<UUID[]>;
    getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]>;
    addParticipant(userId: UUID, roomId: UUID): Promise<boolean>;
    removeParticipant(userId: UUID, roomId: UUID): Promise<boolean>;
    getParticipantsForAccount(userId: UUID): Promise<any[]>;
    getParticipantsForRoom(roomId: UUID): Promise<UUID[]>;
    getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null>;
    setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void>;
    createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean>;
    getRelationship(params: { userA: UUID; userB: UUID }): Promise<Relationship | null>;
    getRelationships(params: { userId: UUID }): Promise<Relationship[]>;
    getKnowledge(params: { id?: UUID; agentId: UUID; limit?: number; query?: string; conversationContext?: string; }): Promise<RAGKnowledgeItem[]>;
    searchKnowledge(params: { agentId: UUID; embedding: Float32Array | number[]; match_threshold: number; match_count: number; searchText?: string; }): Promise<RAGKnowledgeItem[]>;
    createKnowledge(knowledge: RAGKnowledgeItem): Promise<void>;
    removeKnowledge(id: UUID): Promise<void>;
    clearKnowledge(agentId: UUID, shared?: boolean): Promise<void>;
    // For cache adapter capabilities
    get?(key: string): Promise<string | null>;
    set?(key: string, value: string, ttl?: number): Promise<void>;
    delete?(key: string): Promise<void>;
    clear?(namespace?: string): Promise<void>;

}

export interface MemoryContent {
    text: string;
    action?: string;
    attachments?: any[];
    [key: string]: any;
}

export interface Memory {
    id: string;
    userId?: string;
    roomId?: string;
    content: MemoryContent;
    createdAt: number;
    importance: number;
    lastAccessed: number;
    embedding?: number[];
    [key: string]: any;
}

export interface IMemoryManager {
    getMemories(params: { roomId: UUID; count?: number; unique?: boolean; start?: number; end?: number }): Promise<Memory[]>;
    getCachedEmbeddings(content: string): Promise<{ embedding: number[]; levenshtein_score: number }[]>;
    getMemoriesByRoomIds(params: { roomIds: UUID[], limit?: number; }): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    createMemory(memory: Memory, unique?: boolean): Promise<void>;
    removeMemory(memoryId: UUID): Promise<void>;
    removeAllMemories(roomId: UUID): Promise<void>;
    countMemories(roomId: UUID, unique?: boolean): Promise<number>;
    addEmbeddingToMemory(memory: Memory): Promise<Memory>;
}

export interface IAgentRuntime {
    agentId: string;
    serverUrl?: string;
    databaseAdapter?: IDatabaseAdapter;
    settings?: Map<string, string>;
    adapters?: Plugin[]; // Changed from any to Plugin[]
    cacheManager?: ICacheManager;
    clients: { [key: string]: ClientInstance; };
    actions?: Action[];
    character: Character;
    token?: string;
    getSetting(key: string): string | undefined;
    logger: Logger;
    messageManager: IMemoryManager; // This was IMemoryManager from @elizaos/types
    modelProvider: ModelProviderName;
    imageModelProvider?: ModelProviderName;
    fetch?: FetchFunction;
    providers?: Provider[];
    composeState(message: any, additionalKeys?: any): Promise<State>;
    updateRecentMessageState(state: State): Promise<State>;
    getConversationLength(): number;
    stop(): Promise<void>;
    ensureConnection(userId: string, roomId: string, userName?: string, userScreenName?: string, source?: string): Promise<void>;
    processActions(message: any, responses: Memory[], state?: any, callback?: any): Promise<void>;
    evaluate(message: any, state?: any, didRespond?: boolean, callback?: any): Promise<string[] | null>;
    handleMessage(message: any): Promise<void>;
    initialize(): Promise<void>; // Added based on AgentRuntime
}

export interface Goal {
    id: UUID;
    agentId: UUID;
    roomId?: UUID;
    userId?: UUID;
    name?: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'failed' | GoalStatus;
    priority: number;
    createdAt: number;
    completedAt?: number;
    metadata?: Record<string, any>;
    objectives?: any[];
}

export type HandlerCallback = (data: any) => Promise<void>;

export interface Actor {
    id: UUID;
    name: string;
    [key: string]: any;
}

export enum ModelProviderName {
    OPENAI = "openai",
    ETERNALAI = "eternalai",
    ANTHROPIC = "anthropic",
    CLAUDE_VERTEX = "claude_vertex",
    GROK = "grok",
    GROQ = "groq",
    LLAMACLOUD = "llama_cloud",
    TOGETHER = "together",
    LLAMALOCAL = "llama_local",
    LMSTUDIO = "lmstudio",
    GOOGLE = "google",
    MISTRAL = "mistral",
    REDPILL = "redpill",
    OPENROUTER = "openrouter",
    OLLAMA = "ollama",
    HEURIST = "heurist",
    GALADRIEL = "galadriel",
    FAL = "fal",
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
    INFERA = "infera",
    DEEPSEEK = "deepseek",
    BEDROCK = "bedrock",
    ATOMA = "atoma",
    SECRETAI = "secret_ai",
    NEARAI = "nearai",
    LETZAI = "letzai"
}

export enum ModelClass {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    EMBEDDING = "embedding",
    IMAGE = "image"
}

export type IDatabaseCacheAdapter = any;
export type IImageDescriptionService = any;
export type ITextGenerationService = any;
export type TelemetrySettings = any;

export enum CacheStore {
    DATABASE = "DATABASE",
    FILESYSTEM = "FILESYSTEM",
}
