import settings from './settings.js';
import {
    ModelClass,
    ModelProviderName,
} from './types.js';
import type {
    EmbeddingModelSettings,
    ImageModelSettings,
    Models,
    ModelSettings,
} from './types.js';
import { elizaLogger } from './logger.js';

export const models: Models = {
    [ModelProviderName.OPENAI]: {
        endpoint: settings.OPENAI_API_URL || "https://api.openai.com/v1",
        model: {
            [ModelClass.SMALL]: {
                name: settings.SMALL_OPENAI_MODEL || "gpt-4o-mini",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.MEDIUM]: {
                name: settings.MEDIUM_OPENAI_MODEL || "gpt-4o",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.LARGE]: {
                name: settings.LARGE_OPENAI_MODEL || "gpt-4o",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.EMBEDDING]: {
                name:
                    settings.EMBEDDING_OPENAI_MODEL || "text-embedding-3-small",
                dimensions: 1536,
            },
            [ModelClass.IMAGE]: {
                name: settings.IMAGE_OPENAI_MODEL || "dall-e-3",
            },
        },
    },
    [ModelProviderName.ETERNALAI]: {
        endpoint: settings.ETERNALAI_URL,
        model: {
            [ModelClass.SMALL]: {
                name:
                    settings.ETERNALAI_MODEL ||
                    "neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.MEDIUM]: {
                name:
                    settings.ETERNALAI_MODEL ||
                    "neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.LARGE]: {
                name:
                    settings.ETERNALAI_MODEL ||
                    "neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
        },
    },
    [ModelProviderName.ANTHROPIC]: {
        endpoint: settings.ANTHROPIC_API_URL || "https://api.anthropic.com/v1",
        model: {
            [ModelClass.SMALL]: {
                name:
                    settings.SMALL_ANTHROPIC_MODEL || "claude-3-haiku-20240307",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name:
                    settings.MEDIUM_ANTHROPIC_MODEL ||
                    "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },

            [ModelClass.LARGE]: {
                name:
                    settings.LARGE_ANTHROPIC_MODEL ||
                    "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
        },
    },
    [ModelProviderName.CLAUDE_VERTEX]: {
        endpoint: settings.ANTHROPIC_API_URL || "https://api.anthropic.com/v1", // TODO: check
        model: {
            [ModelClass.SMALL]: {
                name: "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: "claude-3-opus-20240229",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
        },
    },
    [ModelProviderName.GROK]: {
        endpoint: "https://api.x.ai/v1",
        model: {
            [ModelClass.SMALL]: {
                name: settings.SMALL_GROK_MODEL || "grok-2-1212",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: settings.MEDIUM_GROK_MODEL || "grok-2-1212",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: settings.LARGE_GROK_MODEL || "grok-2-1212",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: settings.EMBEDDING_GROK_MODEL || "grok-2-1212", // not sure about this one
            },
        },
    },
    [ModelProviderName.GROQ]: {
        endpoint: "https://api.groq.com/openai/v1",
        model: {
            [ModelClass.SMALL]: {
                name: settings.SMALL_GROQ_MODEL || "llama-3.1-8b-instant",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: settings.MEDIUM_GROQ_MODEL || "llama-3.3-70b-versatile",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name:
                    settings.LARGE_GROQ_MODEL || "llama-3.2-90b-vision-preview",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: settings.EMBEDDING_GROQ_MODEL || "llama-3.1-8b-instant",
            },
        },
    },
    [ModelProviderName.LLAMACLOUD]: {
        endpoint: "https://api.llamacloud.com/v1",
        model: {
            [ModelClass.SMALL]: {
                name: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                repetition_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: "meta-llama-3.1-8b-instruct",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                repetition_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                repetition_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: "togethercomputer/m2-bert-80M-32k-retrieval",
            },
            [ModelClass.IMAGE]: {
                name: "black-forest-labs/FLUX.1-schnell",
                steps: 4,
            },
        },
    },
    [ModelProviderName.TOGETHER]: {
        endpoint: settings.TOGETHER_API_URL || "https://api.together.ai/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.LLAMALOCAL]: {
        endpoint: settings.LLAMALOCAL_API_URL || "http://localhost:8080/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.LMSTUDIO]: {
        endpoint: settings.LMSTUDIO_API_URL || "http://localhost:1234/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.GOOGLE]: {
        endpoint: settings.GOOGLE_API_URL || "https://generativelanguage.googleapis.com/v1beta",
        model: {
            [ModelClass.SMALL]: { name: "gemini-1.5-flash-latest", stop: [], maxInputTokens: 1048576, maxOutputTokens: 8192, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "gemini-1.5-pro-latest", stop: [], maxInputTokens: 1048576, maxOutputTokens: 8192, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "gemini-1.5-pro-latest", stop: [], maxInputTokens: 1048576, maxOutputTokens: 8192, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "text-embedding-004", dimensions: 768 },
        },
    },
    [ModelProviderName.MISTRAL]: {
        endpoint: settings.MISTRAL_API_URL || "https://api.mistral.ai/v1",
        model: {
            [ModelClass.SMALL]: { name: "mistral-small-latest", stop: [], maxInputTokens: 32768, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "mistral-medium-latest", stop: [], maxInputTokens: 32768, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "mistral-large-latest", stop: [], maxInputTokens: 32768, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "mistral-embed", dimensions: 1024 },
        },
    },
    [ModelProviderName.REDPILL]: {
        endpoint: settings.REDPILL_API_URL || "https://api.redpill.ai/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.OPENROUTER]: {
        endpoint: settings.OPENROUTER_API_URL || "https://openrouter.ai/api/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.OLLAMA]: {
        endpoint: settings.OLLAMA_API_URL || "http://localhost:11434/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.HEURIST]: {
        endpoint: settings.HEURIST_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.GALADRIEL]: {
        endpoint: settings.GALADRIEL_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    falai: {
        endpoint: settings.FAL_API_URL || "https://api.fal.ai/v1",
        model: {
            [ModelClass.SMALL]: {
                name: settings.SMALL_FAL_MODEL || "fal-small-placeholder",
                stop: [],
                maxInputTokens: 8000,
                maxOutputTokens: 2000,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: settings.MEDIUM_FAL_MODEL || "fal-medium-placeholder",
                stop: [],
                maxInputTokens: 16000,
                maxOutputTokens: 4000,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: settings.LARGE_FAL_MODEL || "fal-large-placeholder",
                stop: [],
                maxInputTokens: 32000,
                maxOutputTokens: 4000,
                temperature: 0.7,
            },
            [ModelClass.IMAGE]: {
                name: settings.IMAGE_FAL_MODEL || "fal-image-placeholder",
            },
            [ModelClass.EMBEDDING]: {
                name: settings.EMBEDDING_FAL_MODEL || "fal-embedding-placeholder",
                dimensions: 768,
            },
        },
    },
    [ModelProviderName.GAIANET]: {
        endpoint: settings.GAIANET_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.ALI_BAILIAN]: {
        endpoint: settings.ALI_BAILIAN_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.VOLENGINE]: {
        endpoint: settings.VOLENGINE_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.NANOGPT]: {
        endpoint: settings.NANOGPT_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 2048, maxOutputTokens: 256, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 2048, maxOutputTokens: 256, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 2048, maxOutputTokens: 256, temperature: 0.7 },
        },
    },
    [ModelProviderName.HYPERBOLIC]: {
        endpoint: settings.HYPERBOLIC_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.VENICE]: {
        endpoint: settings.VENICE_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.NVIDIA]: {
        endpoint: settings.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1",
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
            [ModelClass.IMAGE]: { name: "placeholder-image" },
        },
    },
    [ModelProviderName.NINETEEN_AI]: {
        endpoint: settings.NINETEEN_AI_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.AKASH_CHAT_API]: {
        endpoint: settings.AKASH_CHAT_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.LIVEPEER]: {
        endpoint: settings.LIVEPEER_API_URL,
        model: {
            [ModelClass.IMAGE]: { name: "placeholder-image" },
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
        },
    },
    [ModelProviderName.INFERA]: {
        endpoint: settings.INFERA_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.DEEPSEEK]: {
        endpoint: settings.DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
        model: {
            [ModelClass.SMALL]: { name: "deepseek-coder", stop: [], maxInputTokens: 16384, maxOutputTokens: 4096, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "deepseek-chat", stop: [], maxInputTokens: 16384, maxOutputTokens: 4096, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "deepseek-chat", stop: [], maxInputTokens: 16384, maxOutputTokens: 4096, temperature: 0.7 },
        },
    },
    [ModelProviderName.BEDROCK]: {
        endpoint: settings.BEDROCK_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.ATOMA]: {
        endpoint: settings.ATOMA_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.SECRETAI]: {
        endpoint: settings.SECRETAI_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.NEARAI]: {
        endpoint: settings.NEARAI_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
    [ModelProviderName.LETZAI]: {
        endpoint: settings.LETZAI_API_URL,
        model: {
            [ModelClass.SMALL]: { name: "placeholder-small", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.MEDIUM]: { name: "placeholder-medium", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.LARGE]: { name: "placeholder-large", stop: [], maxInputTokens: 8192, maxOutputTokens: 2048, temperature: 0.7 },
            [ModelClass.EMBEDDING]: { name: "placeholder-embedding" },
        },
    },
};

// Helper function to convert ModelProviderName to string key for models object
function getModelKey(modelName: string): string | undefined {
    return Object.keys(ModelProviderName).find(key => ModelProviderName[key as keyof typeof ModelProviderName] === modelName);
}

// Helper function to convert ModelClass to string key for model object
function getModelClassKey(modelClass: ModelClass): string {
    switch (modelClass) {
        case ModelClass.SMALL: return 'small';
        case ModelClass.MEDIUM: return 'medium';
        case ModelClass.LARGE: return 'large';
        case ModelClass.EMBEDDING: return 'embedding';
        case ModelClass.IMAGE: return 'image';
        default: return 'medium'; // Default fallback
    }
}

/**
 * Gets the model settings for a specific provider and model class.
 */
export function getModelSettings(
    provider: ModelProviderName,
    type: ModelClass
): ModelSettings | undefined {
    const providerModels = models[provider]?.model;
    if (!providerModels) {
        return undefined;
    }
    return providerModels[getModelClassKey(type)] as ModelSettings;
}

/**
 * Gets the embedding model settings for a specific provider.
 */
export function getEmbeddingModelSettings(
    provider: ModelProviderName
): EmbeddingModelSettings | undefined {
    const providerModels = models[provider]?.model;
    if (!providerModels) {
        return undefined;
    }
    return providerModels[getModelClassKey(ModelClass.EMBEDDING)] as EmbeddingModelSettings;
}

/**
 * Gets the endpoint for a specific provider.
 */
export function getEndpoint(provider: ModelProviderName): string | undefined {
    const providerConfig = models[provider];
    if (!providerConfig || !providerConfig.endpoint) {
        return undefined;
    }
    return providerConfig.endpoint;
}
