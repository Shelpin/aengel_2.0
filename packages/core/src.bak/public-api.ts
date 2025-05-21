// Public API exports
// Do not export from both ./api/types and ./types - choose one source of truth
// For public API types, we prefer ./types as the canonical source

// ✅ Explicit type re-exports from canonical source
export type {
  IAgentRuntime,
  Client,
  Content,
  Media,
  Memory,
  Plugin,
  // Additional types needed by adapter-sqlite and other packages
  IDatabaseAdapter,
  IDatabaseCacheAdapter,
  Account,
  Actor,
  Participant,
  Goal,
  GoalStatus,
  RAGKnowledgeItem,
  UUID,
  Character,
  ClientInstance,
  Adapter,
  ModelProviderName,
  CacheStore,
  Provider,
  State,
  KnowledgeManager
} from './types.js';

// Temporary re-exports for backward compatibility
// Note: These should be moved to appropriate public API modules in the future
export { composeContext } from './context.js';
export { elizaLogger } from './logger.js';
export { generateMessageResponse, generateTrueOrFalse } from './generation.js';
export { getGoals } from './goals.js';
export { AgentRuntime } from './runtime.js';

// Export common functions
export { default as knowledge } from './knowledge.js';

// Export additional types for dependent packages
export type { generateText } from './generation.js';
export { parseJsonArrayFromText } from './parsing.js';

// API types
export type { IAgentRuntimeBridge } from './api/types.js';
export type { IMemoryManager } from './api/types.js';
export type { AgentLogLevel, IAgentLogger } from './api/types.js';

// Note: Removed duplicate exports of MemoryManager, generateText, and parseJsonArrayFromText
// Note: Removed duplicate section with agent imports due to missing module 