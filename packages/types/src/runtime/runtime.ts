import { UUID } from '../common/uuid.js';

/**
 * Agent runtime interface
 */
export interface IAgentRuntime {
    getAgentId(): UUID;
    getLogger(name: string): any;

    // Settings management
    getSetting(key: string, defaultValue?: any): Promise<any>;
    setSetting?(key: string, value: any): Promise<void>;

    // Platform access
    getPlatform?(): any;

    // Additional optional methods that may be implemented
    getDatabase?(): any;
    getMemory?(): any;
} 