import TelegramBot from 'node-telegram-bot-api';
import type { User as TelegramUser, Message as TelegramMessage } from 'node-telegram-bot-api';
import type { IAgentRuntime } from '@elizaos/core'; // Assuming IAgentRuntime is available from core

// Add options interface for constructor overloading
interface TelegramClientOptions {
  botToken?: string; // Make botToken optional here, will be fetched from runtime
  runtime?: IAgentRuntime; // Keep for flexibility, though AgentRuntime will provide it
  [key: string]: any;
}

/**
 * Telegram client for ElizaOS
 * 
 * This client provides a wrapper around the node-telegram-bot-api
 * with methods for sending and receiving messages.
 */
class TelegramClient {
  public name: string = 'telegram'; // For identification by AgentRuntime or debug logs
  private bot: TelegramBot | null = null;
  private token: string = '';
  private messageHandlers: Array<(message: TelegramMessage) => void> = [];
  private botInfo: TelegramUser | null = null;
  private runtime: IAgentRuntime | null = null; // Store runtime instance

  constructor(tokenOrOptions?: string | TelegramClientOptions) {
    // Constructor can be lean, or pre-set token if provided directly (though our agent factory doesn't do this)
    if (typeof tokenOrOptions === 'string') {
      this.token = tokenOrOptions; 
    }
    // Actual bot initialization will happen in initialize(runtime)
  }

  // This method is called by AgentRuntime from @elizaos/core
  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log(`[TELEGRAM] Client '${this.name}' is being initialized by AgentRuntime.`);
    this.runtime = runtime; // Store the runtime instance

    const tokenFromRuntime = this.runtime.character?.settings?.secrets?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

    if (!tokenFromRuntime) {
      console.error('[TELEGRAM] No token found in runtime.character.settings.secrets.TELEGRAM_BOT_TOKEN or process.env.TELEGRAM_BOT_TOKEN. Cannot initialize bot.');
      return;
    }
    this.token = tokenFromRuntime;

    console.log(`[DEBUG] TelegramClient initialize(runtime) called. Token from runtime: ${this.token ? this.token.substring(0, 5) : 'NULL'}...`);

    try {
      this.bot = new TelegramBot(this.token, { polling: true });

      this.bot.on('message', (message: TelegramMessage) => {
        console.log(`[TELEGRAM] Received message (for AgentRuntime): ${JSON.stringify(message, null, 2)}`);
        
        // Use the stored this.runtime
        if (this.runtime && this.runtime.handleMessage && typeof this.runtime.handleMessage === 'function') {
          this.runtime.handleMessage(message)
            .then(() => { /* elizaLogger.debug('[TELEGRAM] Message passed to runtime.handleMessage successfully.') */ })
            .catch((err: any) => console.error('[TELEGRAM] Error invoking this.runtime.handleMessage:', err));
        } else {
          console.error('[TELEGRAM] this.runtime or this.runtime.handleMessage is not defined or not a function! Cannot process message via runtime.');
        }

        // Also notify other direct handlers (if any)
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error(`[TELEGRAM] Error in additional message handler: ${error}`);
          }
        });
      });

      this.bot.getMe().then((info: TelegramUser) => {
        this.botInfo = info;
        console.log(`[TELEGRAM] Bot initialized (by AgentRuntime): ${info.username}`);
      }).catch((error: Error) => {
        console.error(`[TELEGRAM] Error getting bot info (during AgentRuntime init): ${error}`);
      });

      console.log(`[TELEGRAM] Client initialized by AgentRuntime with token: ${this.token.substring(0, 5)}...`);

      if (this.bot?.isPolling()) {
        console.warn('[POLLING ACTIVE] Telegram bot is polling (after AgentRuntime init)!');
      } else {
        console.log('[POLLING INACTIVE] Telegram bot created but not polling (after AgentRuntime init).');
      }
    } catch (error) {
      console.error(`[TELEGRAM] Error initializing Telegram bot (during AgentRuntime init): ${error}`);
      this.bot = null;
    }
  }

  // This method can be used by other plugins if they want to listen to raw messages from this client
  on(event: string, handler: (message: TelegramMessage) => void): void {
    if (event === 'message') {
      this.messageHandlers.push(handler);
      console.log(`[TELEGRAM] Registered an additional message handler for '${this.name}' client.`);
    } else {
      console.warn(`[TELEGRAM] Unsupported event for 'on' method: ${event}`);
    }
  }

  async sendMessage(chatId: number | string, text: string, options: any = {}): Promise<any> {
    if (!this.bot) {
      console.error('[TELEGRAM] Bot not initialized for sendMessage');
      return { ok: false, error: 'Bot not initialized for sendMessage' };
    }
    try {
      console.log(`[TELEGRAM] Sending message to ${chatId}: ${text.substring(0, 50)}...`);
      const result = await this.bot.sendMessage(chatId, text, options);
      return { ok: true, result };
    } catch (error) {
      console.error(`[TELEGRAM] Error sending message: ${error}`);
      return { ok: false, error };
    }
  }

  /**
   * Get information about a chat
   */
  async getChat(chatId: number | string): Promise<any> {
    if (!this.bot) {
      console.error('[TELEGRAM] Bot not initialized');
      return { ok: false, error: 'Bot not initialized' };
    }

    try {
      const chat = await this.bot.getChat(chatId);
      return chat;
    } catch (error) {
      console.error(`[TELEGRAM] Error getting chat: ${error}`);
      return { ok: false, error };
    }
  }

  /**
   * Get the bot information
   */
  get getBotInfo(): TelegramUser | null {
    return this.botInfo;
  }

  /**
   * Stop the Telegram bot polling and cleanup
   */
  public stop(): void {
    if (this.bot) {
      try {
        this.bot.stopPolling();
        console.log('[TELEGRAM] Bot polling stopped');
      } catch (error) {
        console.error('[TELEGRAM] Error stopping bot polling:', error);
      }
    } else {
      console.warn('[TELEGRAM] stop() called but bot is not initialized');
    }
  }
}

export { TelegramClient };

function createTelegramClientInstance() {
  return new TelegramClient();
}

export default createTelegramClientInstance; 