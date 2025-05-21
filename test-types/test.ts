// @ts-check
import { IAgentRuntimeBridge } from "../packages/core/dist/types/types/agent-runtime-bridge.js";
// Test using the imported type
const bridge: IAgentRuntimeBridge = { knowledgeManager: { getKnowledge: async () => ({}), setKnowledge: async () => {} } };
console.log("Type import successful:", bridge);
