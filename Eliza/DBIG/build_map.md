# DBIG Summary Table

| Package Name | Package Path | Entry Files | tsconfig.build.json | skipLibCheck | emitDeclarationOnly | DeclarationDir | tsup.config.ts | Imports From | Imported By | TS Build Errors | Cycles? | Deep Imports Used |
|--------------|--------------|-------------|---------------------|--------------|---------------------|---------------|---------------|--------------|-------------|-----------------|---------|------------------|
| cli | packages/cli/package.json | index.js | No | - | - | - | No |  |  | Yes | No | No |
| @elizaos/core | packages/core/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | - | ./dist | Yes | @elizaos/adapter-sqlite | @elizaos/adapter-sqlite, @elizaos/plugin-bootstrap, @elizaos/client-direct, @elizaos/agent | None | Yes* | No |
| @elizaos/adapter-sqlite | packages/adapter-sqlite/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | false | dist | Yes | @elizaos/core | @elizaos/core | Yes | Yes* | No |
| @elizaos/telegram-client | packages/clients/telegram/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | - | ./dist | No |  | @elizaos/telegram-multiagent, @elizaos/agent | None | No | No |
| @elizaos-plugins/clients | packages/clients/package.json | dist/index.mjs | No | - | - | - | No |  | @elizaos/agent | Yes | No | No |
| @elizaos/telegram-multiagent | packages/telegram-multiagent/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | - | dist | Yes | @elizaos/telegram-client | @elizaos/agent | Yes | Yes | No |
| @elizaos/dynamic-imports | packages/dynamic-imports/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | - | - | dist | Yes |  |  | None | No | No |
| @elizaos/plugin-bootstrap | packages/plugin-bootstrap/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | true | dist | Yes | @elizaos/core | @elizaos/agent | Yes | No | No |
| @elizaos/client-direct | packages/client-direct/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | true | dist | Yes | @elizaos/agent, @elizaos/core | @elizaos/agent | Yes | No | No |
| @elizaos/agent | packages/agent/package.json | dist/index.cjs, src/index.ts, src/public-api.ts | Yes | true | - | ./dist | Yes | @elizaos/core, @elizaos/plugin-bootstrap, @elizaos/telegram-multiagent, @elizaos/telegram-client, @elizaos/client-direct | @elizaos/client-direct | Yes | No | No |

*Note: The circular dependency between core and adapter-sqlite exists at the package.json level but not at the file level. See `circular-dependencies-analysis.md` for details.
