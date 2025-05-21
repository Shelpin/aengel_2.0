export interface Memory {
  roomId: string;
  userId: string;
  content?: {
    text?: string;
  };
}

export interface IAgentRuntimeMinimal {
  agentId: string;
  messageManager: {
    getMemories(options: {
      roomId: string;
      start: number;
      end: number;
      count: number;
      unique: boolean;
    }): Promise<Memory[]>;
  };
}

// Extended internal type used by knowledge.ts
export interface IAgentRuntime extends IAgentRuntimeMinimal {
  knowledgeManager?: any;
  documentsManager?: any;
  serverUrl?: string;
  databaseAdapter?: any;
  modelProvider?: any;
  character?: any;
  fetch?: any;
  getSetting?: (key: string) => any;
}

export interface State {
  agentName?: string;
}

export interface Provider {
  get(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string>;
}

export interface KnowledgeManager {
  getKnowledge: (message: Memory, options?: any) => Promise<any>;
  setKnowledge: (data: any) => Promise<void>;
}

// Consolidated IAgentRuntimeBridge interface
export interface IAgentRuntimeBridge {
  knowledgeManager?: {
    getKnowledge: (...args: any[]) => Promise<any>;
    setKnowledge: (...args: any[]) => Promise<void>;
  };
  character?: any;
  fetch?: any;
  getSetting?: (key: string) => any;
  // Add additional props ONLY if used by providers
}

export interface IMemoryManager {
  getMemory<T = any>(key?: string): Promise<T | null>;
  setMemory<T = any>(value: T, key?: string): Promise<void>;
  clearMemories(key?: string): Promise<void>;
  getAllMemoryKeys(): Promise<string[]>;
}

export type AgentLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface IAgentLogger {
  log(level: AgentLogLevel, message: string, data?: any): void;
} 