import type { User as TelegramUser, Message as TelegramMessage } from 'node-telegram-bot-api';
declare global {
    var __elizaRuntime: {
        clients?: {
            telegram?: any;
            [key: string]: any;
        };
        [key: string]: any;
    };
}
interface TelegramClientOptions {
    botToken: string;
    runtime?: any;
    [key: string]: any;
}
/**
 * Telegram client for ElizaOS
 *
 * This client provides a wrapper around the node-telegram-bot-api
 * with methods for sending and receiving messages.
 */
declare class TelegramClient {
    private bot;
    private token;
    private messageHandlers;
    private botInfo;
    /**
     * Initialize the Telegram client with a bot token
     */
    constructor(tokenOrOptions?: string | TelegramClientOptions);
    /**
     * Initialize the client with a token
     */
    initialize(token: string, runtime?: any): void;
    /**
     * Register a handler for incoming messages
     */
    on(event: string, handler: (message: TelegramMessage) => void): void;
    /**
     * Send a message to a chat
     */
    sendMessage(chatId: number | string, text: string, options?: any): Promise<any>;
    /**
     * Get information about a chat
     */
    getChat(chatId: number | string): Promise<any>;
    /**
     * Get the bot information
     */
    get getBotInfo(): TelegramUser | null;
    /**
     * Stop the Telegram bot polling and cleanup
     */
    stop(): void;
}
export { TelegramClient };
declare function createTelegramClientInstance(): TelegramClient;
export default createTelegramClientInstance;
//# sourceMappingURL=index.d.ts.map