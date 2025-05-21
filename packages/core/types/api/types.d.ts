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
export interface IAgentRuntimeBridge {
    knowledgeManager?: KnowledgeManager;
    character?: any;
    fetch?: any;
    getSetting?: (key: string) => any;
}
