import { type IAgentRuntime } from './types.js';
export declare const EmbeddingProvider: {
    readonly OpenAI: "OpenAI";
    readonly Ollama: "Ollama";
    readonly GaiaNet: "GaiaNet";
    readonly Heurist: "Heurist";
    readonly BGE: "BGE";
};
export type EmbeddingProviderType = (typeof EmbeddingProvider)[keyof typeof EmbeddingProvider];
export type EmbeddingConfig = {
    readonly dimensions: number;
    readonly model: string;
    readonly provider: EmbeddingProviderType;
};
export declare const getEmbeddingConfig: () => EmbeddingConfig;
export declare function getEmbeddingType(runtime: IAgentRuntime): "local" | "remote";
export declare function getEmbeddingZeroVector(): number[];
/**
 * Gets embeddings from a remote API endpoint.  Falls back to local BGE/384
 *
 * @param {string} input - The text to generate embeddings for
 * @param {EmbeddingOptions} options - Configuration options including:
 *   - model: The model name to use
 *   - endpoint: Base API endpoint URL
 *   - apiKey: Optional API key for authentication
 *   - isOllama: Whether this is an Ollama endpoint
 *   - dimensions: Desired embedding dimensions
 * @param {IAgentRuntime} runtime - The agent runtime context
 * @returns {Promise<number[]>} Array of embedding values
 * @throws {Error} If the API request fails
 */
export declare function embed(runtime: IAgentRuntime, input: string): Promise<number[]>;
