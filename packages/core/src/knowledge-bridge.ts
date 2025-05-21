// src/knowledge-bridge.ts
import type { IAgentRuntimeBridge } from './api/types.js';
import knowledge from './knowledge.js';

export function callKnowledgeSet(runtime: IAgentRuntimeBridge, item: any) {
  return knowledge.set(runtime, item);
}

export function callKnowledgeGet(runtime: IAgentRuntimeBridge, message: any) {
  return knowledge.get(runtime, message);
} 