import { getEmbeddingModelSettings, getEndpoint } from './models.js';
import { type IAgentRuntime, ModelProviderName } from './types.js';
import settings from './settings.js';
import elizaLogger from './logger.js';
import LocalEmbeddingModelManager from './localembeddingManager.js';

interface EmbeddingOptions {
    model: string;
    endpoint: string;
    apiKey?: string;
    length?: number;
    isOllama?: boolean;
    dimensions?: number;
    provider?: string;
}

export const EmbeddingProvider = {
    OpenAI: "OpenAI",
    Ollama: "Ollama",
    GaiaNet: "GaiaNet",
    Heurist: "Heurist",
    BGE: "BGE",
} as const;

export type EmbeddingProviderType =
    (typeof EmbeddingProvider)[keyof typeof EmbeddingProvider];

export type EmbeddingConfig = {
    readonly dimensions: number;
    readonly model: string;
    readonly provider: EmbeddingProviderType;
};

export const getEmbeddingConfig = (): EmbeddingConfig => {
    const openaiSettings = getEmbeddingModelSettings(ModelProviderName.OPENAI);
    const ollamaSettings = getEmbeddingModelSettings(ModelProviderName.OLLAMA);
    const gaiaNetSettings = getEmbeddingModelSettings(ModelProviderName.GAIANET);
    const heuristSettings = getEmbeddingModelSettings(ModelProviderName.HEURIST);

    const dimensions =
        settings.USE_OPENAI_EMBEDDING?.toLowerCase() === "true"
            ? openaiSettings?.dimensions
            : settings.USE_OLLAMA_EMBEDDING?.toLowerCase() === "true"
                ? ollamaSettings?.dimensions
                : settings.USE_GAIANET_EMBEDDING?.toLowerCase() === "true"
                    ? gaiaNetSettings?.dimensions
                    : settings.USE_HEURIST_EMBEDDING?.toLowerCase() === "true"
                        ? heuristSettings?.dimensions
                        : 384; // Default BGE dimension

    const model =
        settings.USE_OPENAI_EMBEDDING?.toLowerCase() === "true"
            ? openaiSettings?.name
            : settings.USE_OLLAMA_EMBEDDING?.toLowerCase() === "true"
                ? ollamaSettings?.name
                : settings.USE_GAIANET_EMBEDDING?.toLowerCase() === "true"
                    ? gaiaNetSettings?.name
                    : settings.USE_HEURIST_EMBEDDING?.toLowerCase() === "true"
                        ? heuristSettings?.name
                        : "BGE-small-en-v1.5"; // Default BGE model

    const provider: EmbeddingProviderType =
        settings.USE_OPENAI_EMBEDDING?.toLowerCase() === "true"
            ? "OpenAI"
            : settings.USE_OLLAMA_EMBEDDING?.toLowerCase() === "true"
                ? "Ollama"
                : settings.USE_GAIANET_EMBEDDING?.toLowerCase() === "true"
                    ? "GaiaNet"
                    : settings.USE_HEURIST_EMBEDDING?.toLowerCase() === "true"
                        ? "Heurist"
                        : "BGE";

    return {
        // Provide default fallbacks if any setting lookup failed
        dimensions: dimensions ?? 384,
        model: model ?? "BGE-small-en-v1.5",
        provider: provider,
    };
};

async function getRemoteEmbedding(
    input: string,
    options: EmbeddingOptions
): Promise<number[]> {
    // Ensure endpoint ends with /v1 for OpenAI
    const baseEndpoint = options.endpoint.endsWith("/v1")
        ? options.endpoint
        : `${options.endpoint}${options.isOllama ? "/v1" : ""}`;

    // Construct full URL
    const fullUrl = `${baseEndpoint}/embeddings`;

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(options.apiKey
                ? {
                    Authorization: `Bearer ${options.apiKey}`,
                }
                : {}),
        },
        body: JSON.stringify({
            input,
            model: options.model,
            dimensions:
                options.dimensions ||
                options.length ||
                getEmbeddingConfig().dimensions, // Prefer dimensions, fallback to length
        }),
    };

    try {
        const response = await fetch(fullUrl, requestOptions);

        if (!response.ok) {
            elizaLogger.error("API Response:", await response.text()); // Debug log
            throw new Error(
                `Embedding API Error: ${response.status} ${response.statusText}`
            );
        }

        interface EmbeddingResponse {
            data: Array<{ embedding: number[] }>;
        }

        const data: EmbeddingResponse = await response.json();
        return data?.data?.[0].embedding;
    } catch (e) {
        elizaLogger.error("Full error details:", e);
        throw e;
    }
}

export function getEmbeddingType(runtime: IAgentRuntime): "local" | "remote" {
    const isNode =
        typeof process !== "undefined" &&
        process.versions != null &&
        process.versions.node != null;

    // Use local embedding if:
    // - Running in Node.js
    // - Not using OpenAI provider
    // - Not forcing OpenAI embeddings
    const isLocal =
        isNode &&
        runtime.character.modelProvider !== ModelProviderName.OPENAI &&
        runtime.character.modelProvider !== ModelProviderName.GAIANET &&
        runtime.character.modelProvider !== ModelProviderName.HEURIST &&
        !settings.USE_OPENAI_EMBEDDING;

    return isLocal ? "local" : "remote";
}

export function getEmbeddingZeroVector(): number[] {
    let embeddingDimension = 384; // Default BGE dimension

    if (settings.USE_OPENAI_EMBEDDING?.toLowerCase() === "true") {
        const openaiSettings = getEmbeddingModelSettings(ModelProviderName.OPENAI);
        embeddingDimension = openaiSettings?.dimensions ?? embeddingDimension;
    } else if (settings.USE_OLLAMA_EMBEDDING?.toLowerCase() === "true") {
        const ollamaSettings = getEmbeddingModelSettings(ModelProviderName.OLLAMA);
        embeddingDimension = ollamaSettings?.dimensions ?? embeddingDimension;
    } else if (settings.USE_GAIANET_EMBEDDING?.toLowerCase() === "true") {
        const gaiaSettings = getEmbeddingModelSettings(ModelProviderName.GAIANET);
        embeddingDimension = gaiaSettings?.dimensions ?? embeddingDimension;
    } else if (settings.USE_HEURIST_EMBEDDING?.toLowerCase() === "true") {
        const heuristSettings = getEmbeddingModelSettings(ModelProviderName.HEURIST);
        embeddingDimension = heuristSettings?.dimensions ?? embeddingDimension;
    }

    return Array(embeddingDimension).fill(0);
}

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

export async function embed(runtime: IAgentRuntime, input: string) {
    elizaLogger.debug("Embedding request:", {
        modelProvider: runtime.character.modelProvider,
        useOpenAI: process.env.USE_OPENAI_EMBEDDING,
        input: input?.slice(0, 50) + "...",
        inputType: typeof input,
        inputLength: input?.length,
        isString: typeof input === "string",
        isEmpty: !input,
    });

    // Validate input
    if (!input || typeof input !== "string" || input.trim().length === 0) {
        elizaLogger.warn("Invalid embedding input:", {
            input,
            type: typeof input,
            length: input?.length,
        });
        return []; // Return empty embedding array
    }

    // Check cache first
    const cachedEmbedding = await retrieveCachedEmbedding(runtime, input);
    if (cachedEmbedding) return cachedEmbedding;

    const config = getEmbeddingConfig();
    const isNode = typeof process !== "undefined" && process.versions?.node;

    // Determine which embedding path to use
    if (config.provider === EmbeddingProvider.OpenAI) {
        const endpoint = settings.OPENAI_API_URL || "https://api.openai.com/v1";
        return await getRemoteEmbedding(input, {
            model: config.model,
            endpoint: endpoint,
            apiKey: settings.OPENAI_API_KEY,
            dimensions: config.dimensions,
        });
    }

    if (config.provider === EmbeddingProvider.Ollama) {
        const endpoint = runtime.character.modelEndpointOverride || getEndpoint(ModelProviderName.OLLAMA);
        if (!endpoint) throw new Error("Ollama endpoint not configured");
        return await getRemoteEmbedding(input, {
            model: config.model,
            endpoint: endpoint,
            isOllama: true,
            dimensions: config.dimensions,
        });
    }

    if (config.provider == EmbeddingProvider.GaiaNet) {
        const endpoint = runtime.character.modelEndpointOverride ||
            getEndpoint(ModelProviderName.GAIANET) ||
            settings.SMALL_GAIANET_SERVER_URL ||
            settings.MEDIUM_GAIANET_SERVER_URL ||
            settings.LARGE_GAIANET_SERVER_URL;
        if (!endpoint) throw new Error("GaiaNet endpoint not configured");
        return await getRemoteEmbedding(input, {
            model: config.model,
            endpoint: endpoint,
            apiKey: settings.GAIANET_API_KEY ?? runtime.token ?? undefined,
            dimensions: config.dimensions,
        });
    }

    if (config.provider === EmbeddingProvider.Heurist) {
        const endpoint = getEndpoint(ModelProviderName.HEURIST);
        if (!endpoint) throw new Error("Heurist endpoint not configured");
        return await getRemoteEmbedding(input, {
            model: config.model,
            endpoint: endpoint,
            apiKey: settings.HEURIST_API_KEY ?? runtime.token ?? undefined,
            dimensions: config.dimensions,
        });
    }

    // BGE - try local first if in Node
    if (isNode) {
        try {
            return await getLocalEmbedding(input);
        } catch (error) {
            elizaLogger.warn(
                "Local embedding failed, falling back to remote",
                error
            );
        }
    }

    // Fallback to remote override
    const fallbackEndpoint = runtime.character.modelEndpointOverride ||
        getEndpoint(runtime.character.modelProvider);

    if (!fallbackEndpoint) {
        throw new Error(`Could not determine endpoint for provider: ${runtime.character.modelProvider}`);
    }

    return await getRemoteEmbedding(input, {
        model: config.model,
        endpoint: fallbackEndpoint, // Use the validated endpoint
        apiKey: runtime.token ?? undefined,
        dimensions: config.dimensions,
    });

    async function getLocalEmbedding(input: string): Promise<number[]> {
        elizaLogger.debug("DEBUG - Inside getLocalEmbedding function");

        try {
            const embeddingManager = LocalEmbeddingModelManager.getInstance();
            return await embeddingManager.generateEmbedding(input);
        } catch (error) {
            elizaLogger.error("Local embedding failed:", error);
            throw error;
        }
    }

    async function retrieveCachedEmbedding(
        runtime: IAgentRuntime,
        input: string
    ) {
        if (!input) {
            elizaLogger.log("No input to retrieve cached embedding for");
            return null;
        }

        const similaritySearchResult =
            await runtime.messageManager.getCachedEmbeddings(input);
        if (similaritySearchResult.length > 0) {
            return similaritySearchResult[0].embedding;
        }
        return null;
    }
}
