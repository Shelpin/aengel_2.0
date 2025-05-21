import { z } from 'zod';
import { UserAddressService } from '../services/UserAddressService';
import { AeternityWalletService } from '../services/AeternityWalletService';
import { TransactionService } from '../services/transactionService';
import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';

// Input schema for processAddressRegistration action
export const processAddressRegistrationSchema = z.object({
  // Telegram username
  username: z.string().min(1),
  
  // Aeternity address
  address: z.string().min(1).refine(
    (addr) => addr.startsWith('ak_'),
    { message: 'Invalid Aeternity address format, must start with ak_' }
  ),
  
  // Optional chat ID for group notifications
  chatId: z.string().optional(),
});

// Input type derived from schema
export type ProcessAddressRegistrationInput = z.infer<typeof processAddressRegistrationSchema>;

// Output type for processAddressRegistration action
export type ProcessAddressRegistrationOutput = {
  success: boolean;
  pendingTipsProcessed?: number;
  error?: string;
  message?: string;
};

/**
 * Process an address registration from a Telegram user and handle any pending tips
 * @param input - Registration parameters
 * @param context - Action context
 * @returns Registration result
 */
export const processAddressRegistration = async (
  input: ProcessAddressRegistrationInput,
  context: any
): Promise<ProcessAddressRegistrationOutput> => {
  try {
    // Validate input
    const params = processAddressRegistrationSchema.parse(input);
    
    // Get or create UserAddressService provider
    const userAddressService = context.runtime.getService(UserAddressService.serviceType) as UserAddressService;
    
    // Store the address
    await userAddressService.setAddress(params.username, params.address);
    
    // -- START: Comment out Pending Tip Logic ---
    /* 
    // Check for pending tips
    const pendingTips = userAddressService.getPendingTips(params.username);
    
    // Get Telegram client if available
    const telegramClient = context.telegramClient || context.runtime.getClient?.('telegram');
    
    if (pendingTips.length === 0) {
      // No pending tips, just return success
      
      // If we have a chatId and telegramClient, notify the group
      if (params.chatId && telegramClient && telegramClient.sendMessage) {
        try {
          await telegramClient.sendMessage(
            params.chatId,
            `@${params.username} has registered their Aeternity address and is now ready to receive tips! 🎉`
          );
        } catch (error) {
          console.error('Failed to send group notification:', error);
          // Continue even if notification fails
        }
      }
      
      return {
        success: true,
        pendingTipsProcessed: 0,
        message: `Address ${params.address} has been registered for @${params.username}. No pending tips to process.`,
      };
    }
    
    // Get wallet provider for processing pending tips
    const walletService = context.runtime.getService(UserAddressService.serviceType) as AeternityWalletService;
    const transactionService = new TransactionService(walletService);
    
    // Process pending tips
    const results = [];
    for (const pendingTip of pendingTips) {
      try {
        // Execute transfer
        const result = await transactionService.transferAe({
          recipient: params.address,
          amount: pendingTip.amount,
        });
        
        results.push({
          success: result.status === 'success',
          hash: result.hash,
          error: result.error,
          pendingTip,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          pendingTip,
        });
      }
    }
    
    // Calculate statistics for successful tips
    const successfulTips = results.filter(r => r.success);
    const totalAmount = successfulTips.length > 0 
      ? successfulTips.reduce((sum, r) => sum + parseFloat(r.pendingTip.amount), 0).toFixed(4)
      : "0";
    
    // Send DM notification about processed tips
    if (telegramClient) {
      try {
        if (successfulTips.length > 0) {
          await telegramClient.sendDirectMessage(
            params.username,
            `Great news! Your address ${params.address} has been registered, and you've received ${successfulTips.length} pending tips totaling ${totalAmount} AE!\n\n` +
            successfulTips.map(tip => 
              `${tip.pendingTip.amount} AE - ${tip.pendingTip.message || 'No message'} (TX: ${tip.hash})`
            ).join('\n')
          );
        }
      } catch (error) {
        console.error('Failed to send tip notification:', error);
        // Continue even if notification fails
      }
      
      // If we have a chatId, also notify the group
      if (params.chatId && telegramClient.sendMessage && successfulTips.length > 0) {
        try {
          await telegramClient.sendMessage(
            params.chatId,
            `🎉 @${params.username} has registered their Aeternity address and received ${successfulTips.length} pending tips totaling ${totalAmount} AE!`
          );
        } catch (error) {
          console.error('Failed to send group notification:', error);
          // Continue even if notification fails
        }
      }
    }
    
    // Clear processed tips
    userAddressService.clearPendingTips(params.username);
    */
    // -- END: Comment out Pending Tip Logic ---
    
    // Return success result (modified to reflect no pending tips processed)
    return {
      success: true,
      pendingTipsProcessed: 0, // Assume 0 since logic is commented out
      message: `Address ${params.address} has been registered for @${params.username}. Pending tip processing is currently disabled.`,
    };
  } catch (error) {
    console.error('Failed to process address registration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Action descriptor for processAddressRegistration
export const processAddressRegistrationAction: Action = {
  name: 'PROCESS_ADDRESS_REGISTRATION',
  similes: ['PROCESS_ADDRESS_REGISTRATION'],
  description: 'Register an Aeternity address for a Telegram user and process any pending tips',
  examples: [
    {
      input: {
        username: "telegram_user",
        address: "ak_2buwmB9YM81jiXEECXcfpw6D7kp4RNixzDc5wWqHcqFymcacKP",
        chatId: "group_chat_id"
      },
      output: {
        success: true,
        pendingTipsProcessed: 0,
        message: "Address registered successfully"
      }
    }
  ],
  validate: async (rt: IAgentRuntime, msg: Memory, state?: State): Promise<boolean> => {
    const msgAsAny = msg as any; // Type assertion for properties not on generic Memory type
    elizaLogger.debug('[VALIDATE] PROCESS_ADDRESS_REGISTRATION - Checking DM status:', {
      isDirectMessage: msgAsAny.isDirectMessage,
      optionsIsDirectMessage: msgAsAny.options?.isDirectMessage,
      roomId: msg.roomId, // roomId and userId are on the base Memory type
      userId: msg.userId,
      isRoomEqualToUser: msg.roomId === msg.userId
    });

    // This action should NOT run for Direct Messages.
    const isDM = msgAsAny.isDirectMessage || msgAsAny.options?.isDirectMessage || msg.roomId === msg.userId;
    if (isDM) {
      elizaLogger.info('[VALIDATE] PROCESS_ADDRESS_REGISTRATION: Detected Direct Message. This action will not handle it. Returning false.');
      return false;
    }

    const userAddressService = rt.getService(UserAddressService.serviceType) as UserAddressService;
    const address = await userAddressService.getAddress(msg.userId);
    elizaLogger.debug(`[VALIDATE] PROCESS_ADDRESS_REGISTRATION (Non-DM) | Checking address for userId: ${msg.userId}, Found: ${address}`);
    return !address;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: any }, // Add type index signature for options
    callback?: HandlerCallback // Keep signature, but don't use for sending message
  ) => {
    elizaLogger.debug('[PROCESS_ADDRESS_REGISTRATION_HANDLER] Entered handler');
    if (!message) {
      elizaLogger.error('[PROCESS_ADDRESS_REGISTRATION_HANDLER] CRITICAL: message object is undefined or null!');
      return [];
    }

    const userId = message.userId;
    elizaLogger.debug(`[PROCESS_ADDRESS_REGISTRATION_HANDLER] userId: ${userId}`);
    const chatId = message.roomId; // Assuming roomId holds the group chat ID
    elizaLogger.debug(`[PROCESS_ADDRESS_REGISTRATION_HANDLER] chatId: ${chatId}`);
    
    // Fetch user details for tagging
    let userName: string | undefined;
    elizaLogger.debug(`[PROCESS_ADDRESS_REGISTRATION_HANDLER] Attempting to fetch account for userId: ${userId}`);
    try {
        const account = await runtime.databaseAdapter.getAccountById(userId);
        userName = account?.username || account?.name; // Prefer username, fallback to name
        elizaLogger.debug(`[PROCESS_ADDRESS_REGISTRATION_HANDLER] Fetched user details for ${userId}: Username=${userName}`);
    } catch (dbError: any) { // Catch as any to log more broadly
        elizaLogger.error('[PROCESS_ADDRESS_REGISTRATION_HANDLER] Error fetching user details:', { userId, error: dbError, message: dbError?.message, stack: dbError?.stack });
        // Do not re-throw, allow handler to proceed or fail further down if userName is critical
    }
    // const userName = message.userName || message.userScreenName; // OLD - Property doesn't exist

    // Store the full message for resuming the tip later (if applicable)
    elizaLogger.debug(`[PROCESS_ADDRESS_REGISTRATION] Attempting to cache original message under pending_tip:${userId}`);
    try {
      // Temporarily comment out to see if this is the source of the error
      // await runtime.cacheManager.set(`pending_tip:${userId}`, message);
      elizaLogger.info(`[PROCESS_ADDRESS_REGISTRATION] Successfully (conceptually) cached message. Actual call is commented out.`);
    } catch (cacheError) {
      elizaLogger.error(`[PROCESS_ADDRESS_REGISTRATION] CRITICAL: Error caching original message for pending_tip:${userId}:`, cacheError);
      // Decide if we should proceed if caching fails. For now, we will, but this might break tip resumption.
    }

    // --- Send message directly using Telegram Client ---
    try {
      // Get the Telegraf context if available
      // Try getting context from the handler's options argument
      const ctx = options?.telegramContext;

      // if (!ctx || !ctx.reply) { // Original check
      if (!ctx || typeof ctx.reply !== 'function') { // Also check if reply is a function
        elizaLogger.error('[PROCESS_ADDRESS_REGISTRATION] Telegraf context (ctx) or ctx.reply method not available in handler options.');
        // Log the structure of options for debugging
        elizaLogger.debug('[PROCESS_ADDRESS_REGISTRATION] message object:', message); 
        elizaLogger.debug('[PROCESS_ADDRESS_REGISTRATION] options object:', options); 
        return [];
      }
      
      // Construct user tag, preferring username but falling back to userId
      let userTag = userName ? `@${userName}` : `User \\(${userId}\\)`;
      userTag = userTag.replace(/[_*[\\\]()~`>#+\-=|{}.!]/g, '\\\\$&'); // Escape MarkdownV2 characters

      const textToSend = `👋 Hey ${userTag}\\! I don\\'t have your Æternity wallet address registered yet\\. Please reply *directly to me* \\(not in this group\\) with your \\\`ak\\_\\.\\.\\.\\\` address starting with \\\`RegisterAddress\\\` so I can send you tips in the future\\. Example: \\\`RegisterAddress ak\\_YourAddressHere\\\``;

      elizaLogger.info(`[PROCESS_ADDRESS_REGISTRATION] Attempting to send address request via ctx.reply to chat derived from context, tagging: ${userTag}`);
      
      // Use ctx.reply to send the message
      await ctx.reply(textToSend, { parse_mode: 'MarkdownV2' });
      
      elizaLogger.info(`[PROCESS_ADDRESS_REGISTRATION] Successfully sent address request message via ctx.reply.`);

    } catch (error) {
      // Log the specific error encountered during sendMessage/reply
      // Make sure to log the full error object
      elizaLogger.error('[PROCESS_ADDRESS_REGISTRATION] Error sending address request message using ctx.reply:', error); 
    }
    // --- End direct message sending ---

    return [];
  },
}; 