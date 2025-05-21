// This file is the main entry point for the @elizaos/core package.
// It should export all public-facing APIs.

// Export all types (consolidated from packages/types and core-specific)
export * from './types.js';

// Export core runtime, managers, and utilities
export { AgentRuntime } from './runtime.js';
export { elizaLogger } from './logger.js';
export { MemoryManager } from './memory.js';
export { RAGKnowledgeManager } from './ragknowledge.js';
export { DatabaseAdapter as CoreDatabaseAdapter } from './database.js'; // Example, adjust if needed
export { composeContext } from './context.js';
// export { handleSystemMessage } from './messages.js'; // Commented out
export { createGoal, getGoals, updateGoal } from './goals.js'; // Removed removeGoal, removeAllGoals
// export { generateText, generateImage, handleNearAi, getModelProvider, getModel } from './generation.js'; // Commented out problematic exports
export { generateText, generateImage, generateObject, generateShouldRespond, generateTrueOrFalse, generateTextArray, generateMessageResponse, generateObjectArray, generateObjectDeprecated, generateCaption, generateTweetActions, splitChunks, splitText, trimTokens } from './generation.js'; // Added missing exports and kept existing ones
// export { evaluateAction, evaluateGoal, evaluateMessage } from './evaluators.js'; // Commented out
export { formatEvaluatorNames, formatEvaluators, formatEvaluatorExamples, formatEvaluatorExampleDescriptions, evaluationTemplate } from './evaluators.js'; // Added missing exports
// export { processProviders } from './providers.js'; // Commented out
export { getProviders } from './providers.js'; // Corrected export
export { createRelationship, getRelationship, getRelationships, formatRelationships } from './relationships.js';
export * from './actions.js';
export * from './cache.js';
export * from './embedding.js';
export * from './environment.js';
export * from './models.js';
export * from './parsing.js';
export * from './posts.js';
export * from './uuid.js';
export { formatMessages, formatTimestamp, getActorDetails, formatActors } from './messages.js'; // Added exports from messages.js
export { getEnvVariable, validateEnv, validateCharacterConfig, CharacterSchema, envSchema } from './environment.js'; // Added getEnvVariable and other exports

// Remove old export if it exists
// export * from './public-api.js'; // This line should be removed or commented out
