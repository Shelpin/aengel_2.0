# Aeternity Plugin Examples

This directory contains example scripts that demonstrate the usage of the Aeternity plugin for ElizaOS.

## Running Examples

These examples are meant to be run in the context of an ElizaOS environment. They may not run directly as standalone scripts due to dependencies on the ElizaOS runtime.

### Contribution Analysis Example

The `contribution-analysis-example.ts` script demonstrates how to:

1. Analyze Telegram contributions to determine their value
2. Get recommended tip amounts based on contribution level
3. Send tips with auto-calculated amounts
4. Customize tip amounts for different contribution levels

### Notes on Running Examples

When running examples, you may encounter these issues:

#### Missing elizaos Module Error

The error `Cannot find module 'elizaos' or its corresponding type declarations` appears because the examples import from the ElizaOS package, which would be available in a real ElizaOS environment.

**This error is expected and can be ignored.** We've added mock type declarations in `plugin-aeternity/src/types/elizaos.d.ts` to prevent TypeScript errors during development, but the actual module would only be available in a real ElizaOS environment.

#### ContributionAnalyzerService Runtime Parameter

You may see errors like `Expected 1-2 arguments, but got 0` or `An argument for 'runtime' was not provided` related to the ContributionAnalyzerService constructor. This service requires the ElizaOS runtime to be passed as a parameter for accessing LLM capabilities.

In actual ElizaOS deployments, the runtime would be provided automatically when the plugin initializes. For development and testing, the service falls back to keyword-based analysis when the LLM is not available.

In a real environment, ElizaOS would provide:
- The runtime environment
- Plugin management
- Action execution
- Provider registration

#### Fixing Dependencies

When running examples outside of ElizaOS:

1. Make sure you have the required dependencies installed:
   ```
   pnpm add @aeternity/aepp-sdk@13.2.2 crypto-js@^4.2.0 @types/crypto-js
   ```

2. For demonstration purposes, you could create a mock ElizaOS runtime that implements the basic interfaces needed by the examples, but this would be a significant effort and is not necessary for understanding the plugin's functionality.

#### SDK Version Compatibility

The plugin is designed to work with aepp-sdk version 13.2.2 and may need adjustments for other versions.

The current implementation has been updated to work with newer SDK versions where:
- `MemoryAccount` is instantiated with `new MemoryAccount()` instead of `MemoryAccount()`
- `Node` and `Universal` are instantiated with `new`
- Account implementations require `signTypedData` and `signDelegation` methods
- Secret keys use the `sk_` prefix format 