/**
 * MOCK TYPES FOR DEVELOPMENT ONLY
 * 
 * These type declarations are only for development purposes to prevent TypeScript errors.
 * In a real ElizaOS environment, these types would be provided by the ElizaOS package.
 */
declare module 'elizaos' {
  export interface Runtime {
    executeAction(actionName: string, params: any): Promise<any>;
    registerProvider(name: string, provider: any): Promise<void>;
    hasProvider(name: string): boolean;
    getProvider(name: string): Promise<any>;
    telegramClient?: any;
  }

  export interface RuntimeOptions {
    plugins: any[];
  }

  export function initializeRuntime(options: RuntimeOptions): Promise<Runtime>;
} 