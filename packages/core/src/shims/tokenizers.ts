// File: packages/core/src/shims/tokenizers.ts
// This is a shim for the tokenizers module that safely handles the native dependency

/**
 * Tokenizers shim to handle native module dependencies safely
 * This prevents build errors when the native modules are not available
 */

// Define interfaces for the tokenizer types we need
export interface TokenizerResult {
    ids: number[];
    tokens: string[];
}

export interface TokenizerInterface {
    encode(text: string): TokenizerResult;
    decode(ids: number[]): string;
}

// Safe exports that don't require the actual native modules
export const safeTokenizerExports = {
    Tokenizer: class SafeTokenizer implements TokenizerInterface {
        constructor() {
            console.warn('Using safe tokenizer shim - native functionality not available');
        }
        encode(text: string): TokenizerResult {
            return { ids: [], tokens: text.split(' ') };
        }
        decode(ids: number[]): string {
            return ids.join(' ');
        }
    }
};

// Dynamic import function that won't break builds
export async function loadTokenizers(): Promise<{
    Tokenizer: new (options?: any) => TokenizerInterface;
}> {
    try {
        // Dynamically import tokenizers only at runtime using require
        // This avoids TypeScript's static analysis issues
        const dynamicRequire = eval('require');
        const tokenizers = dynamicRequire('tokenizers');
        return tokenizers;
    } catch (e) {
        console.warn('Native tokenizers module not available, using fallback');
        return safeTokenizerExports;
    }
}

// Safe exports
export default safeTokenizerExports; 