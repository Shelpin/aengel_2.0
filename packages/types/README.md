# @elizaos/types

Common TypeScript type definitions for ElizaOS.

This package contains shared types that are used across multiple ElizaOS packages. By centralizing these types, we prevent circular dependencies and ensure consistency across the codebase.

## Usage

```typescript
// Import types from the package
import { UUID, DatabaseAdapter, Memory, IAgentRuntime } from '@elizaos/types';

// Use the types in your code
const myUuid: UUID = '123e4567-e89b-12d3-a456-426614174000';
```

## Type Categories

The package includes the following categories of types:

- **Common Types**: Basic types like UUID and result interfaces
- **Database Types**: Database adapter interfaces and connection options
- **Agent Types**: Agent runtime, configuration, and plugin interfaces
- **Memory Types**: Memory storage and query interfaces

## Why a Separate Types Package?

A separate types package provides several benefits:

1. **Breaks Circular Dependencies**: Prevents circular dependency issues that can occur when two packages import types from each other
2. **Centralizes Type Definitions**: Provides a single source of truth for shared types
3. **Simplifies Type Updates**: Makes it easier to update types used across multiple packages
4. **Improves Build Performance**: Reduces the need for complex TypeScript path mapping

## Contributing

When adding new types to this package:

1. Place them in the appropriate category directory
2. Export them from the category's index.ts file
3. Ensure they are properly documented with JSDoc comments
4. Keep them focused on interface definitions, not implementations 