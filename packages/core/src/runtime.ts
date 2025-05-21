import { IAgentRuntime, ClientInstance, Memory, IMemoryManager, Character, ICacheManager, IRAGKnowledgeManager, Action, Evaluator, HandlerCallback, ModelProviderName, Logger as CoreLoggerType, IDatabaseAdapter, Plugin, State, FetchFunction } from "./types.js";
import { elizaLogger as globalLogger } from "./logger.js";

// Re-export for backward compatibility
export type DatabaseAdapter = IDatabaseAdapter;

/**
 * Interface for runtime configuration
 */
export interface RuntimeConfig {
    conversationLength?: number;
    agentId?: string;
    character: Character;
    token: string;
    serverUrl?: string;
    actions?: any[];
    evaluators?: any[];
    plugins?: Plugin[];
    characterPath?: string;
    embedder?: any;
    port?: number;
    imageModelProvider?: ModelProviderName;
    imageVisionModelProvider?: ModelProviderName;
    modelProvider: ModelProviderName;
    databaseAdapter?: IDatabaseAdapter;
    logging?: boolean;
    settings?: Map<string, string>;
    messageManager?: IMemoryManager;
    fetch?: FetchFunction;
}

/**
 * Represents the runtime environment for an agent, handling message processing,
 * action registration, and interaction with external services.
 */
export class AgentRuntime implements IAgentRuntime {
    agentId: string;
    serverUrl: string;
    databaseAdapter: IDatabaseAdapter;
    token: string | undefined;
    modelProvider: ModelProviderName;
    imageModelProvider: ModelProviderName;
    imageVisionModelProvider: ModelProviderName;
    character: Character;
    actions: Action[];
    evaluators: Evaluator[] = [];
    plugins: Plugin[];
    logger: CoreLoggerType; // Will be assigned elizaLogger
    messageManager: IMemoryManager;
    fetch?: FetchFunction;
    settings: Map<string, string>;

    public adapters: any[] = [];
    public cacheManager: ICacheManager | null = null;
    public clients: { [key: string]: ClientInstance } = {};
    public loadedPlugins: Plugin[] = [];

    handleMessage: (message: any) => Promise<void>;

    constructor(config: RuntimeConfig) {
        this.agentId = config.agentId || "agent";
        this.serverUrl = config.serverUrl || "https://example.com";
        this.databaseAdapter = config.databaseAdapter || {} as IDatabaseAdapter;
        this.logger = globalLogger; // Use imported elizaLogger

        if (!config.character) throw new Error("Character configuration is required in RuntimeConfig");
        this.character = config.character;
        this.messageManager = config.messageManager || {} as IMemoryManager;
        this.modelProvider = config.modelProvider;
        this.token = config.token;
        this.imageModelProvider = config.imageModelProvider || 'openai' as ModelProviderName;
        this.imageVisionModelProvider = config.imageVisionModelProvider || 'openai' as ModelProviderName;
        this.fetch = config.fetch;
        this.plugins = config.plugins || [];
        this.settings = config.settings || new Map<string, string>();
        this.actions = config.actions || [];
        this.evaluators = config.evaluators || [];

        // Bind the standalone handleMessage function to this instance
        this.handleMessage = async (msg: any): Promise<void> => {
            // Call the separate handleMessage function, ensuring 'this' context is correct
            await handleMessageFunction.call(this, msg);
        };
    }

    getSetting(key: string): string | undefined {
        return this.settings.get(key) || process.env[key];
    }

    async initialize(): Promise<void> {
        this.logger.info("AgentRuntime initializing..."); // Direct use of this.logger
        this.clients = {};
        this.loadedPlugins = [];

        if (this.plugins && Array.isArray(this.plugins)) {
            this.logger.info(`Found ${this.plugins.length} providers to process.`); // Direct use
            for (const providerItem of this.plugins) {
                let pluginInstance: any = null;
                let pluginName = 'UnknownPlugin';

                try {
                    if (typeof providerItem === 'object' && providerItem !== null) {
                        pluginInstance = providerItem;
                        pluginName = pluginInstance?.name || pluginInstance?.constructor?.name || pluginName;
                    } else {
                        this.logger.warn('Encountered an invalid item in the plugins array (not an object instance):', providerItem); // Direct use
                        continue;
                    }

                    this.logger.info(`Processing provider: ${pluginName}`); // Direct use

                    if (pluginInstance) {
                        this.loadedPlugins.push(pluginInstance as Plugin);

                        if (pluginInstance.name && typeof pluginInstance.sendMessage === 'function') {
                            if (this.clients[pluginInstance.name]) {
                                this.logger.warn(`Client with name ${pluginInstance.name} is already registered. Overwriting.`); // Direct use
                            }
                            this.clients[pluginInstance.name] = pluginInstance as ClientInstance;
                            this.logger.info(`Registered client: ${pluginInstance.name}`); // Direct use
                        }

                        if (typeof pluginInstance.initialize === 'function') {
                            this.logger.info(`Calling initialize() for ${pluginName}.`); // Direct use
                            await pluginInstance.initialize(this);
                            this.logger.info(`Provider ${pluginName} initialized.`); // Direct use
                        } else {
                            this.logger.debug(`Provider ${pluginName} does not have an initialize() method.`); // Direct use
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error processing provider ${pluginName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`, error); // Direct use
                }
            }
        } else {
            this.logger.info("No providers found in config to process."); // Direct use
        }

        this.logger.info("AgentRuntime core initialization complete."); // Direct use
        if (Object.keys(this.clients).length > 0) {
            this.logger.info(`Active clients registered in runtime: ${Object.keys(this.clients).join(', ')}`); // Direct use
        } else {
            this.logger.warn("No clients were registered in the runtime after processing providers."); // Direct use
        }
    }

    async composeState(message: Memory, additionalKeys?: Record<string, any>): Promise<State> {
        this.logger.debug("Composing state (stub)", { message, additionalKeys }); // Direct use
        // TODO: Implement actual state composition
        return { /* stub state object */ } as State;
    }

    async updateRecentMessageState(state: State): Promise<State> {
        this.logger.debug("Updating recent message state (stub)", { state }); // Direct use
        // TODO: Implement actual state update logic
        return state; // Return input state for now
    }

    getConversationLength(): number {
        this.logger.debug("Getting conversation length (stub)"); // Direct use
        // TODO: Implement actual conversation length logic
        return 0; // Return dummy value
    }

    async stop(): Promise<void> {
        this.logger.warn("AgentRuntime.stop() called but not implemented."); // Direct use
        return Promise.resolve();
    }

    async ensureConnection(userId: string, roomId: string, userName?: string, userScreenName?: string, source?: string): Promise<void> {
        this.logger.warn("AgentRuntime.ensureConnection() called but not implemented.", { userId, roomId, source }); // Direct use
        return Promise.resolve();
    }

    async processActions(message: Memory, responses: Memory[], state?: any, callback?: any): Promise<void> {
        this.logger.warn("AgentRuntime.processActions() called but not implemented.", { messageId: message.id }); // Direct use
        return Promise.resolve();
    }

    async evaluate(message: Memory, state?: State, didRespond?: boolean, callback?: HandlerCallback): Promise<string[] | null> {
        try {
            this.logger.info(`[EVALUATOR] Starting evaluation for message: ${message.content?.text?.substring(0, 50)}...`); // Direct use

            const evaluatorsToRun = await Promise.all(
                this.evaluators.map(async (evaluator) => {
                    const shouldRun = evaluator.alwaysRun || await evaluator.validate(this, message, state);
                    if (shouldRun) {
                        this.logger.info(`[EVALUATOR] Will run evaluator: ${evaluator.name}`); // Direct use
                    }
                    return shouldRun ? evaluator : null;
                })
            );

            const validEvaluators = evaluatorsToRun.filter((e): e is Evaluator => e !== null);

            if (validEvaluators.length === 0) {
                this.logger.info('[EVALUATOR] No evaluators to run for this message'); // Direct use
                return null;
            }

            this.logger.info(`[EVALUATOR] Running ${validEvaluators.length} evaluators`); // Direct use

            const results = await Promise.all(
                validEvaluators.map(async (evaluator) => {
                    try {
                        this.logger.info(`[EVALUATOR] Running evaluator: ${evaluator.name}`); // Direct use
                        await evaluator.handler(this, message);
                        this.logger.info(`[EVALUATOR] Completed evaluator: ${evaluator.name}`); // Direct use
                        return evaluator.name;
                    } catch (error) {
                        this.logger.error(`[EVALUATOR] Error in evaluator ${evaluator.name}: ${error instanceof Error ? error.message : String(error)}`); // Direct use
                        return null;
                    }
                })
            );

            const successfulEvaluators = results.filter((name): name is string => name !== null);
            this.logger.info(`[EVALUATOR] Completed evaluation with ${successfulEvaluators.length} successful evaluators`); // Direct use
            return successfulEvaluators;
        } catch (error) {
            this.logger.error(`[EVALUATOR] Error in evaluate: ${error instanceof Error ? error.message : String(error)}`); // Direct use
            return null;
        }
    }
}

// Exporting the new handleMessage function separately to avoid class syntax issues with complex logic
// This function will be bound to the AgentRuntime instance in the constructor.
// Renamed to avoid conflict with the class member
export async function handleMessageFunction(this: AgentRuntime, message: any): Promise<void> { 
    // Now 'this.logger' refers to the shared elizaLogger instance
    this.logger.debug("--- Handling message START ---"); 
    try {
        const clientNames = Object.keys(this.clients || {});
        this.logger.info("[HANDLE_MSG_CLIENT_DEBUG] Registered client names:", clientNames.join(', '));
        if (clientNames.length > 0) {
            clientNames.forEach(name => {
                const clientInstance = this.clients[name];
                this.logger.info("[HANDLE_MSG_CLIENT_DEBUG] Client:", name, "type:", clientInstance?.constructor?.name || 'Unknown');
            });
        } else {
            this.logger.info("[HANDLE_MSG_CLIENT_DEBUG] No clients currently registered in this.clients map.");
        }
    } catch (e: any) { // Typed caught error
        this.logger.warn("[HANDLE_MSG_CLIENT_DEBUG] Error during custom logging of this.clients:", e.message);
    }

    this.logger.debug("Raw incoming message object:", JSON.stringify(message, null, 2));

    const incomingText = message.text;
    const chatId = message.chat?.id || message.chat_id;

    if (!chatId) {
        this.logger.error("❌ Message does not have a valid chat.id or chat_id. Cannot process.");
        // No explicit return here, let it fall through to allow sending an error message if possible
        // However, ensure responseText is set to an error message.
    }

    if (!incomingText || typeof incomingText !== 'string' || incomingText.trim() === '') {
        this.logger.info("ℹ️ Incoming message has no text content or is not a string. Skipping LLM call.");
        // Similar to above, allow sending a message indicating this.
    }

    let responseText = ''; 

    if (!chatId || !incomingText || typeof incomingText !== 'string' || incomingText.trim() === '') {
        responseText = "🤖 Agent Error: Message is malformed or empty (missing chat ID or text).";
    } else {
        try {
            const modelProvider = (this.modelProvider || this.getSetting('MODEL_PROVIDER') || 'openai').toLowerCase();
            this.logger.info("[LLM] Using model provider:", modelProvider);

            if (modelProvider === 'openai' || modelProvider === 'deepseek') {
                let llmApiKey: string | undefined;
                let apiUrl: string;
                let modelName: string;

                if (modelProvider === 'openai') {
                    llmApiKey = this.getSetting('OPENAI_API_KEY');
                    apiUrl = this.getSetting('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
                    modelName = this.getSetting('OPENAI_MODEL_NAME') || this.getSetting('SMALL_OPENAI_MODEL') || 'gpt-3.5-turbo';
                    if (!llmApiKey) {
                        this.logger.error("❌ OpenAI API Key (OPENAI_API_KEY) not configured.");
                        responseText = "🤖 LLM Error: OpenAI API Key not configured.";
                    }
                } else { 
                    llmApiKey = this.getSetting('DEEPSEEK_API_KEY');
                    apiUrl = this.getSetting('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1/chat/completions'; 
                    modelName = this.getSetting('DEEPSEEK_MODEL_NAME') || this.getSetting('SMALL_DEEPSEEK_MODEL') || 'deepseek-chat'; 
                    if (!llmApiKey) {
                        this.logger.error("❌ DeepSeek API Key (DEEPSEEK_API_KEY) not configured.");
                        responseText = "🤖 LLM Error: DeepSeek API Key not configured.";
                    }
                }

                if (llmApiKey && responseText === '') { // Only proceed if API key exists and no prior error
                    this.logger.debug("[LLM_CHARACTER_DEBUG] this.character object:", JSON.stringify(this.character, null, 2));
                    let systemPrompt = `You are ${this.character.name || "a conversational AI"}.`;
                    if (this.character.system) {
                        systemPrompt += ` Your primary purpose and persona: ${this.character.system}`;
                    } else if (this.character.description) { 
                        systemPrompt += ` Your persona: ${this.character.description}`;
                    }
                    if (this.character.style?.all && Array.isArray(this.character.style.all) && this.character.style.all.length > 0) {
                        systemPrompt += ` Your key traits and style: ${this.character.style.all.join(', ')}.`;
                    } else if (this.character.adjectives && Array.isArray(this.character.adjectives) && this.character.adjectives.length > 0) {
                        systemPrompt += ` Your key traits: ${this.character.adjectives.join(', ')}.`;
                    } else if (this.character.traits) { 
                        systemPrompt += ` Traits: ${JSON.stringify(this.character.traits)}.`;
                    }

                    if (this.character.topics && Array.isArray(this.character.topics) && this.character.topics.length > 0) {
                        systemPrompt += ` Your main topics of interest and expertise are: ${this.character.topics.join(', ')}.`;
                    } else if (this.character.interests && Array.isArray(this.character.interests) && this.character.interests.length > 0) { 
                        systemPrompt += ` Your main topics of interest are: ${this.character.interests.join(', ')}.`;
                    } else {
                        systemPrompt += " You are interested in general topics.";
                    }

                    const agentNameLower = (this.character.name || "").toLowerCase();
                    const topicsLower = (this.character.topics || []).join(', ').toLowerCase();
                    if (agentNameLower.includes("aeternity") || agentNameLower.includes("ae") || topicsLower.includes("aeternity") || (this.character.system || "").toLowerCase().includes("aeternity")) {
                        systemPrompt += " You should always try to advocate for and discuss Aeternity blockchain and its ecosystem when the conversation allows, aligning with your dedicated persona. Mention its benefits like state channels, oracles, and scalability."
                    }

                    systemPrompt += " Respond naturally based on this comprehensive persona.";

                    const userPrompt = incomingText;

                    this.logger.debug("[LLM] System Prompt for", modelProvider, ":", systemPrompt.substring(0, 150) + "...");
                    this.logger.debug("[LLM] User Prompt for", modelProvider, ":", userPrompt.substring(0, 150) + "...");
                    this.logger.info("[LLM] Attempting API call to", apiUrl, "with model", modelName);

                    const fetchFn = this.fetch || fetch;
                    const llmApiResponse = await fetchFn(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${llmApiKey}`
                        },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            max_tokens: 1024,
                            temperature: 0.7
                        })
                    });

                    if (!llmApiResponse.ok) {
                        const errorBody = await llmApiResponse.text();
                        this.logger.error("❌", modelProvider.toUpperCase(), "API Error:", llmApiResponse.status, "-", errorBody);
                        responseText = `🤖 LLM Error: API request failed (${llmApiResponse.status}).`;
                    } else {
                        const data = await llmApiResponse.json();
                        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                            responseText = data.choices[0].message.content.trim();
                            this.logger.info("[LLM] Received response from", modelProvider.toUpperCase(), ":", responseText.substring(0, 100) + "...");
                        } else {
                            this.logger.error("❌", modelProvider.toUpperCase(), "API Error: Invalid response structure.", data);
                            responseText = "🤖 LLM Error: Invalid response from API.";
                        }
                    }
                }
            } else {
                this.logger.warn("[LLM] Model provider '", modelProvider, "' is not 'openai' or 'deepseek'. Falling back to echo.");
                responseText = `🤖 Echo (LLM provider '${modelProvider}' not configured): You (${message?.from?.username || message?.from?.id || 'Unknown User'}) said: ${incomingText}`;
            }
        } catch (error: any) { // Typed caught error
            this.logger.error("❌ Exception during LLM call:", error.message, { stack: error.stack });
            responseText = `🤖 LLM Exception: ${error.message}`;
        }
    }

    this.logger.debug("Generated responseText after LLM attempt:", responseText);

    const telegramClient = (this.clients as any)?.telegram; // Assuming telegram client for now

    if (telegramClient && typeof telegramClient.sendMessage === 'function') {
        if (responseText && responseText.trim() !== '') {
            if (!chatId) { // Check chatId again before sending
                 this.logger.error("❌ FATAL: Cannot send response because chatId is still missing before sending.");
            } else {
                this.logger.info("Attempting to send LLM response via client to chatID:", chatId);
                try {
                    // Adapting to potential sendMessage signature: (chatId: string, text: string, options?: any)
                    // Or (message: { chat_id: string, text: string, ... })
                    // For now, sending chatId and text as distinct arguments, which matches TelegramClient's current expectation.
                    await telegramClient.sendMessage(chatId, responseText, { action: 'send_llm_response', originalMessage: message });
                    this.logger.info("✅ Successfully sent LLM response to chatID:", chatId);
                } catch (error: any) { // Typed caught error
                    this.logger.error("❌ Error sending LLM response via Telegram client:", error.message, { stack: error.stack });
                }
            }
        } else {
            this.logger.info("ℹ️ Empty responseText from LLM or after processing, not sending to Telegram.");
        }
    } else {
        this.logger.error("❌ FATAL: Telegram client instance NOT FOUND on this.clients.telegram or it's invalid. Cannot send LLM response.");
    }

    this.logger.debug("--- Handling message END ---");
    // The function is void, no explicit return of the message content needed here
    // The responsibility of sending the message is handled by the client.
} 