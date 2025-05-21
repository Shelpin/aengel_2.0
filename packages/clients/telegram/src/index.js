import TelegramBot from 'node-telegram-bot-api';
/**
 * Telegram client for ElizaOS
 *
 * This client provides a wrapper around the node-telegram-bot-api
 * with methods for sending and receiving messages.
 */
class TelegramClient {
    bot = null;
    token = '';
    messageHandlers = [];
    botInfo = null;
    /**
     * Initialize the Telegram client with a bot token
     */
    constructor(tokenOrOptions) {
        if (!tokenOrOptions) {
            return;
        }
        if (typeof tokenOrOptions === 'string') {
            this.initialize(tokenOrOptions);
        }
        else {
            const { botToken, runtime } = tokenOrOptions;
            this.initialize(botToken, runtime);
        }
    }
    /**
     * Initialize the client with a token
     */
    initialize(token, runtime) {
        // EXPERT DIAGNOSTIC LOG
        console.log(`[DEBUG] TelegramClient initialize() called with token: ${token ? token.substring(0, 5) : 'NULL'}...`);
        if (!token) {
            console.error('[TELEGRAM] No token provided for Telegram client');
            return;
        }
        try {
            this.token = token;
            this.bot = new TelegramBot(token, { polling: true });
            // Set up message handler
            this.bot.on('message', (message) => {
                console.log(`[TELEGRAM] Received message: ${JSON.stringify(message, null, 2)}`);
                // Notify all registered handlers
                this.messageHandlers.forEach(handler => {
                    try {
                        handler(message);
                    }
                    catch (error) {
                        console.error(`[TELEGRAM] Error in message handler: ${error}`);
                    }
                });
            });
            // Get bot info
            this.bot.getMe().then((info) => {
                this.botInfo = info;
                console.log(`[TELEGRAM] Bot initialized: ${info.username}`);
            }).catch((error) => {
                console.error(`[TELEGRAM] Error getting bot info: ${error}`);
            });
            console.log(`[TELEGRAM] Client initialized with token: ${token.substring(0, 5)}...`);
            // EXPERT DIAGNOSTIC LOG
            if (this.bot?.isPolling()) {
                console.warn('[POLLING ACTIVE] Telegram bot is polling right after initialization!');
            }
            else {
                console.log('[POLLING INACTIVE] Telegram bot created but not polling right after initialization.');
            }
            // VALHALLA FIX: Ensure the client is injected into the runtime
            if (runtime) {
                // Ensure clients object exists
                runtime.clients = runtime.clients || {};
                // Inject telegram client
                runtime.clients.telegram = this;
                // Add debug logging
                console.log('[VALHALLA] Telegram client mounted to runtime:', !!runtime.clients?.telegram);
            }
            else if (globalThis.__elizaRuntime) {
                // Try to inject into global runtime if runtime parameter wasn't provided
                globalThis.__elizaRuntime.clients = globalThis.__elizaRuntime.clients || {};
                globalThis.__elizaRuntime.clients.telegram = this;
                console.log('[VALHALLA] Telegram client mounted to global runtime:', !!globalThis.__elizaRuntime.clients?.telegram);
            }
        }
        catch (error) {
            console.error(`[TELEGRAM] Error initializing Telegram bot: ${error}`);
            this.bot = null;
        }
    }
    /**
     * Register a handler for incoming messages
     */
    on(event, handler) {
        if (event === 'message') {
            this.messageHandlers.push(handler);
            console.log(`[TELEGRAM] Registered message handler`);
        }
        else {
            console.warn(`[TELEGRAM] Unsupported event: ${event}`);
        }
    }
    /**
     * Send a message to a chat
     */
    async sendMessage(chatId, text, options = {}) {
        if (!this.bot) {
            console.error('[TELEGRAM] Bot not initialized');
            return { ok: false, error: 'Bot not initialized' };
        }
        try {
            console.log(`[TELEGRAM] Sending message to ${chatId}: ${text.substring(0, 50)}...`);
            const result = await this.bot.sendMessage(chatId, text, options);
            return { ok: true, result };
        }
        catch (error) {
            console.error(`[TELEGRAM] Error sending message: ${error}`);
            return { ok: false, error };
        }
    }
    /**
     * Get information about a chat
     */
    async getChat(chatId) {
        if (!this.bot) {
            console.error('[TELEGRAM] Bot not initialized');
            return { ok: false, error: 'Bot not initialized' };
        }
        try {
            const chat = await this.bot.getChat(chatId);
            return chat;
        }
        catch (error) {
            console.error(`[TELEGRAM] Error getting chat: ${error}`);
            return { ok: false, error };
        }
    }
    /**
     * Get the bot information
     */
    get getBotInfo() {
        return this.botInfo;
    }
    /**
     * Stop the Telegram bot polling and cleanup
     */
    stop() {
        if (this.bot) {
            try {
                this.bot.stopPolling();
                console.log('[TELEGRAM] Bot polling stopped');
            }
            catch (error) {
                console.error('[TELEGRAM] Error stopping bot polling:', error);
            }
        }
        else {
            console.warn('[TELEGRAM] stop() called but bot is not initialized');
        }
    }
}
export { TelegramClient };
// Function to create an instance
function createTelegramClientInstance() {
    // The constructor of TelegramClient can handle tokenOrOptions being undefined
    // or we can decide if the agent should pass them here.
    // For now, let constructor handle it, agent will call .initialize() with token.
    return new TelegramClient();
}
// Export the instance creation function as the default export
export default createTelegramClientInstance;
//# sourceMappingURL=index.js.map