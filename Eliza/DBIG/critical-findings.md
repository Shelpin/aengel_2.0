# ElizaOS Dependency & Build Intelligence Graph - Critical Findings

## Most Critical Issues

### 1. Package-Level Circular Dependency

A **critical circular dependency** exists between `@elizaos/core` and `@elizaos/adapter-sqlite` packages at the package.json level, even though it's not detected at the file level. 

This can cause:
- Build order ambiguity
- Runtime initialization issues
- Non-deterministic builds

See `circular-dependencies-analysis.md` for a detailed explanation and recommended solutions.

### 2. File-Level Circular Dependency

A circular dependency exists in the telegram-multiagent package between these files:
```
telegram-multiagent/src/TelegramMultiAgentPlugin.ts > telegram-multiagent/src/ConversationKickstarter.ts > telegram-multiagent/src/ConversationManager.ts
```

This should be refactored to eliminate the dependency cycle.

### 3. TypeScript Build Errors

Several packages have TypeScript build errors:
- telegram-multiagent
- client-direct
- agent

These errors should be addressed to ensure type safety and correct build output.

### 4. Missing Declaration Files

Some packages don't have the expected .d.ts files in their dist directories. This can cause TypeScript integration issues when these packages are consumed by other packages or applications.

Packages with missing .d.ts files:
- telegram-multiagent
- client-direct
- agent

### 5. Configuration Inconsistencies

The tsconfig.build.json files across packages have inconsistencies in their compiler options, particularly:
- skipLibCheck
- emitDeclarationOnly
- declaration paths

See `tsconfig-deviation.log` for details.

## Build Sequence Recommendation

Based on the analysis, the recommended build sequence (assuming circular dependencies are resolved) would be:

1. @elizaos/types (new package recommended to be created)
2. @elizaos/core
3. @elizaos/adapter-sqlite
4. @elizaos/plugin-bootstrap
5. @elizaos/telegram-client
6. @elizaos/telegram-multiagent
7. @elizaos/agent
8. @elizaos/client-direct
9. cli and other packages

## Next Steps

1. Resolve the circular dependency between core and adapter-sqlite (highest priority)
2. Fix TypeScript build errors across packages, particularly in telegram-multiagent
3. Standardize the tsconfig.build.json configurations
4. Address missing declaration files in agent and client-direct packages
5. Fix file-level circular dependency in telegram-multiagent package 