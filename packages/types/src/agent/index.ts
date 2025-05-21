/**
 * Agent interface definitions
 */

import { UUID } from '../common/index.js';
import {
    Logger,
    Character,
    IMemoryManager,
    ICacheManager,
    Memory,
    Action,
    ClientInstance
} from '../index.js';

// Agent configuration
export interface AgentConfig {
    name: string;
    capabilities?: string[];
    model?: string;
    ports?: {
        webhook?: number;
        http?: number;
        router?: number;
    };
}

// Agent state
export enum AgentState {
    INITIALIZING = 'initializing',
    RUNNING = 'running',
    PAUSED = 'paused',
    STOPPED = 'stopped',
    ERROR = 'error'
}

// Agent runtime interface
export interface IAgentRuntime {
    /**
     * Access agent ID (Property in implementation)
     */
    agentId: string;

    /**
     * Get a logger instance (Method in implementation, property here for compatibility)
     */
    logger: Logger;

    /**
     * Access the agent's character configuration (Property in implementation)
     */
    character: Character;

    /**
     * Access the agent's message manager (Property in implementation)
     */
    messageManager: IMemoryManager;

    /**
     * Access the agent's settings map (Property in implementation)
     */
    settings: Map<string, string>;

    /**
     * Access the agent's action list (Property in implementation)
     */
    actions: Action[];

    /**
     * Access the agent's client instances (Property in implementation)
     */
    clients: ClientInstance[];

    /**
     * Access the agent's cache manager (Property in implementation)
     */
    cacheManager: ICacheManager | null;

    /**
     * Get a specific setting, checking environment variables as fallback.
     */
    getSetting(key: string): string | undefined;

    /**
     * Handle an incoming message
     */
    handleMessage?(message: any): Promise<any>;

    /**
     * Initialize the agent runtime.
     */
    initialize(): Promise<void>;

    /**
     * Stop the agent runtime and clean up resources.
     */
    stop(): Promise<void>;

    /**
     * Ensure user/participant records exist for a given interaction.
     */
    ensureConnection(userId: string, roomId: string, userName?: string, userScreenName?: string, source?: string): Promise<void>;

    /**
     * Process actions associated with a message response.
     */
    processActions(message: Memory, responses: Memory[], state?: any, callback?: any): Promise<void>;

    /**
     * Evaluate a message, potentially triggering responses or actions.
     */
    evaluate(message: Memory, state?: any, didRespond?: boolean, callback?: any): Promise<string[] | null>;

    // --- Methods from previous interface definition (potentially optional or deprecated) ---
    // getState?(): AgentState; 
    // getConfig?(): AgentConfig;

    // --- Methods from AgentRuntime implementation not strictly required by interface users? ---
    // composeState?(message: Memory, additionalKeys?: Record<string, any>): Promise<State>;
    // updateRecentMessageState?(state: State): Promise<State>;
    // getConversationLength?(): number;
}

// Plugin registration
export interface PluginRegistration {
    name: string;
    version: string;
    capabilities: string[];
    initialize: (context: any) => Promise<void>;
    shutdown: () => Promise<void>;
}