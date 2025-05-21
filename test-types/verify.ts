import { IAgentRuntimeBridge } from '@elizaos/core';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { createAgent } from '@elizaos/agent';

// Test type usage
const bridge: IAgentRuntimeBridge = {
    knowledgeManager: {
        getKnowledge: async () => ({}),
        setKnowledge: async () => { }
    }
};

// Test SQLite adapter
const adapter = new SqliteDatabaseAdapter({
    filename: ':memory:'
});

// Test agent creation
const agent = createAgent({
    id: 'test-agent'
});

console.log('Type verification successful'); 