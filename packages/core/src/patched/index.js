/**
 * Common types for ElizaOS
 */
// Export database types
export * from './database/adapter.js';
/**
 * Model provider types
 */
export var ModelProviderName;
(function (ModelProviderName) {
    ModelProviderName["OPENAI"] = "openai";
    ModelProviderName["ETERNALAI"] = "eternalai";
    ModelProviderName["ANTHROPIC"] = "anthropic";
    ModelProviderName["GROK"] = "grok";
    ModelProviderName["GROQ"] = "groq";
    ModelProviderName["LLAMACLOUD"] = "llama_cloud";
    ModelProviderName["TOGETHER"] = "together";
    ModelProviderName["LLAMALOCAL"] = "llama_local";
    ModelProviderName["LMSTUDIO"] = "lmstudio";
    ModelProviderName["GOOGLE"] = "google";
    ModelProviderName["MISTRAL"] = "mistral";
    ModelProviderName["CLAUDE_VERTEX"] = "claude_vertex";
    ModelProviderName["REDPILL"] = "redpill";
    ModelProviderName["OPENROUTER"] = "openrouter";
    ModelProviderName["OLLAMA"] = "ollama";
    ModelProviderName["HEURIST"] = "heurist";
    ModelProviderName["GALADRIEL"] = "galadriel";
    ModelProviderName["FAL"] = "falai";
    ModelProviderName["GAIANET"] = "gaianet";
    ModelProviderName["ALI_BAILIAN"] = "ali_bailian";
    ModelProviderName["VOLENGINE"] = "volengine";
    ModelProviderName["NANOGPT"] = "nanogpt";
    ModelProviderName["HYPERBOLIC"] = "hyperbolic";
    ModelProviderName["VENICE"] = "venice";
    ModelProviderName["NVIDIA"] = "nvidia";
    ModelProviderName["NINETEEN_AI"] = "nineteen_ai";
    ModelProviderName["AKASH_CHAT_API"] = "akash_chat_api";
    ModelProviderName["LIVEPEER"] = "livepeer";
    ModelProviderName["LETZAI"] = "letzai";
    ModelProviderName["DEEPSEEK"] = "deepseek";
    ModelProviderName["INFERA"] = "infera";
    ModelProviderName["BEDROCK"] = "bedrock";
    ModelProviderName["ATOMA"] = "atoma";
    ModelProviderName["SECRETAI"] = "secret_ai";
    ModelProviderName["NEARAI"] = "nearai";
})(ModelProviderName || (ModelProviderName = {}));
/**
 * Model class types
 */
export var ModelClass;
(function (ModelClass) {
    ModelClass["SMALL"] = "small";
    ModelClass["MEDIUM"] = "medium";
    ModelClass["LARGE"] = "large";
    ModelClass["EMBEDDING"] = "embedding";
    ModelClass["IMAGE"] = "image";
})(ModelClass || (ModelClass = {}));
//# sourceMappingURL=index.js.map