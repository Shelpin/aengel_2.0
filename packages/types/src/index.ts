/**
 * Type for UUIDs used across ElizaOS
 */
// Remove incorrect imports
/*
import { GoalStatus, Logger, FetchFunction, ModelProviderName, ModelClass } from './common/index.js';
import { Character, Provider } from './agent/index.js';
import { Relationship } from './database/index.js';
import { RAGKnowledgeItem, IMemoryManager } from './memory/index.js';
import { IMemoryManager as OriginalIMemoryManager } from './memory/manager.js';
*/

// Define missing types as placeholders
export type GoalStatus = 'DONE' | 'FAILED' | 'IN_PROGRESS'; // Simple enum based on usage

// -- Start of new/updated type definitions --

// Inserted Character-related type definitions
export interface ClientConfig {
  name: string;
  [key: string]: unknown;
}

export interface PluginConfig {
  name: string;
  [key: string]: unknown;
}

// Forward declaration for Character used in PostProcessor and other types
// This empty interface will be augmented by the main Character definition below.
export interface Character {}

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

export interface MessageTurn {
  user: string;
  content: MessageContent;
}

export type MessageExample = MessageTurn[]; // Reverted from any

// Main Character interface definition
// This effectively replaces the 'export type Character = any;'
export interface Character {
  id?: string;
  name: string;
  username?: string;
  modelProvider: ModelProviderName; // Assumes ModelProviderName enum is defined elsewhere in this file
  clients: (string | ClientConfig)[];
  plugins?: (string | PluginConfig)[];
  postProcessors?: PostProcessor[];
  settings?: CharacterSettings;
  system?: string;
  bio?: string | string[];
  lore?: string[];
  knowledge?: string[];
  messageExamples?: MessageExample[][];
  postExamples?: string[];
  topics?: string[];
  adjectives?: string[];
  style?: CharacterStyle;
  cache?: CacheOptions;     // These assume CacheOptions, Evaluator, Action are defined
  evaluators?: Evaluator[]; // elsewhere in this file (possibly as 'any' placeholders)
  actions?: Action[];

  // Temporarily added properties based on build errors to investigate usage
  modelEndpointOverride?: string;
  description?: string;
  traits?: string[];
  interests?: string[];
  templates?: any; // Added based on plugin-bootstrap errors
}
// End of inserted definitions

// export type Character = any; // Placeholder - THIS LINE IS REMOVED

// These were existing placeholders, ensure they are not re-declared if Character now uses them.
// If Character needs them and they are 'any', that's fine for now.
export type Provider = any; // Placeholder
export type Relationship = any; // Placeholder
export type RAGKnowledgeItem = any; // Placeholder
export type Logger = any; // Placeholder
export type IMemoryManager = any; // Placeholder
export type FetchFunction = (...args: any[]) => Promise<any>; // Placeholder
export type Objective = any; // Add placeholder for Objective

// --> ADDED PLACEHOLDERS BELOW <--
// Define basic structures for previously problematic types
export interface Account {
    id: UUID;
    userId: UUID;
    provider: string; // e.g., 'telegram', 'discord', 'local'
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

// Define Client and ClientInstance
export interface ClientInstance {
    start(): Promise<void>;
    stop(): Promise<void>;
    sendMessage(message: any): Promise<any>; // Define a more specific message type if possible
    // Add other common methods like getStatus, handleEvent, etc.
}

export interface Client {
    id?: UUID;
    name: string;
    type?: string; // e.g., 'telegram', 'discord'
    config: Record<string, any>;
    instance?: ClientInstance; // The running instance of the client
    status?: 'running' | 'stopped' | 'error';
    start?: (runtime: IAgentRuntime) => Promise<ClientInstance>;
    stop?: () => Promise<void>;
}

export type Adapter = any; // Placeholder - Keep as any for now, define later if needed

// Define Plugin Structure
export interface PluginContext {
    runtime: IAgentRuntime; // Assuming runtime is passed to plugins
    // Add other context properties like config, logger, etc.
}
export interface Plugin {
    name: string;
    version?: string;
    clients?: Client[];
    initialize?(context: PluginContext): Promise<void>;
    shutdown?(): Promise<void>;
    capabilities?: string[];
}

export type Service = any; // Placeholder - Keep as any for now, define later if needed

// Define Action structure, replacing the placeholder
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
    execute: (params: Record<string, any>, context: any) => Promise<any>; // Define context type later if needed
    suppressInitialMessage?: boolean; // Flag to suppress initial message if needed
    examples?: ActionExample[]; // Explicitly add optional examples property
}

export type ActionExample = any; // Placeholder
export type Evaluator = any; // Placeholder
export type EvaluationExample = any; // Placeholder
export type Handler = any; // Placeholder
export type Validator = any; // Placeholder
export type State = any; // Placeholder - Already existed but ensuring consistency
export type Content = any; // Placeholder
export type CacheOptions = any; // Placeholder
export type ICacheManager = any; // Placeholder
export type IRAGKnowledgeManager = any; // Placeholder
export type KnowledgeItem = any; // Placeholder
export type ActionResponse = any; // Placeholder
export type DirectoryItem = any; // Placeholder
export type ChunkRow = any; // Placeholder
// Placeholder Enums - Add more specific values if known/needed
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
// --> END OF ADDED PLACEHOLDERS <--

export type UUID = string;

/**
 * Interface for database adapters
 */
export interface IDatabaseAdapter {
    /**
     * Connects to the database
     */
    connect(): Promise<void>;

    /**
     * Disconnects from the database
     */
    disconnect(): Promise<void>;

    /**
     * Executes a query
     */
    query(sql: string, params?: any[]): Promise<any[]>;

    // Added missing methods based on @elizaos/core usage
    getAccountById(userId: UUID): Promise<any | null>; // Replace 'any' with actual Account type if defined
    createAccount(account: any): Promise<boolean>; // Replace 'any' with actual Account type
    getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]>;
    getMemoryById(id: UUID): Promise<Memory | null>;
    getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]>;
    getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]>;
    getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number }[]>;
    log(params: { body: { [key: string]: unknown }; userId: UUID; roomId: UUID; type: string; }): Promise<void>;
    getActorDetails(params: { roomId: UUID }): Promise<Actor[]>; // Assuming Actor type is defined
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
    getParticipantsForAccount(userId: UUID): Promise<any[]>; // Replace 'any' with actual Participant type
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
}

/**
 * Interface for memory content
 */
export interface MemoryContent {
    /**
     * The text content of the memory
     */
    text: string;

    /**
     * Actions associated with the memory
     */
    action?: string;

    /**
     * Attachments associated with the memory
     */
    attachments?: any[];

    /**
     * Additional properties
     */
    [key: string]: any;
}

/**
 * Memory interface for storing agent memories
 */
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

/**
 * Interface for agent runtime
 */
export interface IAgentRuntime {
    /**
     * The ID of the agent
     */
    agentId: string;

    /**
     * The URL of the server
     */
    serverUrl?: string;

    /**
     * The database adapter
     */
    databaseAdapter?: IDatabaseAdapter;

    // Added missing properties based on @elizaos/core usage and client-direct errors
    settings?: Map<string, string>; // Assuming Map based on AgentRuntime
    adapters?: any; // Placeholder type
    cacheManager?: ICacheManager;
    clients: { [key: string]: ClientInstance; };
    actions?: Action[]; // Assuming array of Action type
    character: Character;
    token?: string;
    getSetting(key: string): string | undefined;
    logger: Logger;
    messageManager: IMemoryManager;
    modelProvider: ModelProviderName;
    imageModelProvider?: ModelProviderName;
    fetch?: FetchFunction;
    providers?: Provider[];

    // Add missing methods based on usage in plugin-bootstrap and client-direct
    composeState(message: any, additionalKeys?: any): Promise<State>;
    updateRecentMessageState(state: State): Promise<State>;
    getConversationLength(): number; // Assuming sync return, adjust if async

    // Added missing methods based on client-direct errors
    stop(): Promise<void>; // Assuming async based on AgentRuntime stop method possibility
    ensureConnection(userId: string, roomId: string, userName?: string, userScreenName?: string, source?: string): Promise<void>;
    processActions(message: any, responses: Memory[], state?: any, callback?: any): Promise<void>;
    evaluate(message: any, state?: any, didRespond?: boolean, callback?: any): Promise<string[] | null>;

    /**
     * Handles an incoming message from a client or plugin.
     */
    handleMessage(message: any): Promise<void>;
}

/**
 * Interface for goals
 */
export interface Goal {
    /**
     * The ID of the goal
     */
    id: UUID;

    /**
     * The agent ID associated with the goal
     */
    agentId: UUID;

    /**
     * The room ID associated with the goal (Assuming this might be needed too)
     */
    roomId?: UUID;

    /**
     * The user ID associated with the goal (Assuming this might be needed too)
     */
    userId?: UUID;

    /**
     * The name of the goal (Assuming this might be needed too)
     */
    name?: string;

    /**
     * The description of the goal
     */
    description: string;

    /**
     * The status of the goal
     */
    status: 'pending' | 'active' | 'completed' | 'failed' | GoalStatus;

    /**
     * The priority of the goal
     */
    priority: number;

    /**
     * When the goal was created
     */
    createdAt: number;

    /**
     * When the goal was completed
     */
    completedAt?: number;

    /**
     * Additional metadata
     */
    metadata?: Record<string, any>;

    /**
     * Objectives for the goal (Assuming this might be needed too)
     */
    objectives?: any[];
}

/**
 * Type for callbacks
 */
export type HandlerCallback = (data: any) => Promise<void>;

/**
 * Actor interface
 */
export interface Actor {
    id: UUID;
    name: string;
    [key: string]: any;
}

// Uncomment original enum declarations
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

// Placeholder Types - Replace with actual implementations
export type IDatabaseCacheAdapter = any; // Placeholder
export type IImageDescriptionService = any; // Placeholder
export type ITextGenerationService = any; // Placeholder
export type TelemetrySettings = any; // Placeholder

// Define CacheStore as an enum
export enum CacheStore {
    DATABASE = "DATABASE",
    FILESYSTEM = "FILESYSTEM",
    // Add other potential values like REDIS if needed
} 