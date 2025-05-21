import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import { UserAddressService } from '../services/UserAddressService';

// const ADDRESS_PREFIX = 'RegisterAddress '; // REMOVED - Prefix no longer needed
const AETERNITY_ADDRESS_REGEX = /^ak_[1-9A-HJ-NP-Za-km-z]{48,50}$/;

/**
 * Handle user sending their Æternity address (ak_...) via Direct Message
 */
export const catchAddressInputAction: Action = {
  name: 'CATCH_ADDRESS_INPUT',
  similes: ['SET_AE_ADDRESS'],
  description: 'Store AE address sent by user via DM and resume pending tip',
  examples: [
    { 
      input: { 
        userId: "user123", 
        content: { 
          text: "ak_2buwmB9YM81jiXEECXcfpw6D7kp4RNixzDc5wWqHcqFymcacKP", 
          source: "telegram" 
        },
        isDirectMessage: true
      }, 
      output: { 
        success: true, 
        message: "Address registered" 
      } 
    }
  ],
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // --- MINIMAL VALIDATION FOR DEBUGGING ---
    // elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE] !!-- THIS IS THE VERY LATEST CODE --!! MINIMAL VALIDATE. Returning TRUE.');
    // Temporarily bypass all other checks to see if the handler can be reached.
    // return true; 
    // --- END MINIMAL VALIDATION ---

    // --- ORIGINAL VALIDATION LOGIC (WITH ENHANCED DEBUGGING) ---
    try {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] RAW MESSAGE OBJECT:', JSON.stringify(message, null, 2));
    } catch (e) {
      elizaLogger.error('[CATCH_ADDRESS_INPUT VALIDATE V2] Error stringifying message object:', e);
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] RAW MESSAGE OBJECT (fallback): ', message);
    }

    const msgAsAny = message as any;

    const isDirectMessageFlag = msgAsAny.isDirectMessage;
    const optionsIsDirectMessageFlag = msgAsAny.options?.isDirectMessage;
    const roomUserMatchFlag = message.roomId === message.userId;
    
    elizaLogger.debug('[CATCH_ADDRESS_INPUT VALIDATE V2] DM Flags:', { 
        isDirectMessage: isDirectMessageFlag, 
        optionsIsDirect: optionsIsDirectMessageFlag, 
        roomEqUser: roomUserMatchFlag
    });

    const isDM = isDirectMessageFlag || optionsIsDirectMessageFlag || roomUserMatchFlag;
    
    if (!isDM) {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition !isDM is TRUE. Returning false (Not a Direct Message).');
      return false;
    } else {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition !isDM is FALSE. Proceeding as DM.');
    }

    const text = (message.content as any).text?.trim();
    elizaLogger.info(`[CATCH_ADDRESS_INPUT VALIDATE V2] Text content received for validation: "${text}"`);
    
    if (!text) {
        elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition !text is TRUE. Returning false (No text content).');
        return false;
    } else {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition !text is FALSE. Proceeding with text content.');
    }
    
    const isValidAddressFormat = AETERNITY_ADDRESS_REGEX.test(text);
    elizaLogger.info(`[CATCH_ADDRESS_INPUT VALIDATE V2] Regex test (AETERNITY_ADDRESS_REGEX.test("${text}")) result: ${isValidAddressFormat}`);

    if (isValidAddressFormat) {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition isValidAddressFormat is TRUE. Validation SUCCEEDED. Returning true.');
      return true;
    } else {
      elizaLogger.info('[CATCH_ADDRESS_INPUT VALIDATE V2] Condition isValidAddressFormat is FALSE. Validation FAILED. Returning false.');
      return false;
    }
    // --- END ORIGINAL VALIDATION LOGIC ---
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    // Removed minimal handler code and directly using the original handler logic
    elizaLogger.info('[CATCH_ADDRESS_INPUT HANDLER] Entered handler.');
    const userId = message.userId;
    const addressToStore = (message.content as any).text.trim(); // The text IS the address
    
    elizaLogger.info(`[CATCH_ADDRESS_INPUT HANDLER] Attempting to store address "${addressToStore}" for userId ${userId}`);

    // Store address
    const userAddressService = runtime.getService(UserAddressService.serviceType) as UserAddressService;
    try {
      await userAddressService.setAddress(userId, addressToStore);
      elizaLogger.info(`[CATCH_ADDRESS_INPUT HANDLER] Successfully stored address ${addressToStore} for user ${userId}`);
      
      // Notify user
      const notificationText = `✅ Got it! Address ${addressToStore} saved. Checking for pending tip...`;
      elizaLogger.info(`[CATCH_ADDRESS_INPUT HANDLER] Sending confirmation: "${notificationText}" to ${userId}`);
      try {
          if (callback) {
              await callback({ text: notificationText });
          } else {
              elizaLogger.warn('[CATCH_ADDRESS_INPUT HANDLER] No callback provided to send confirmation DM.');
          }
      } catch (e) {
          elizaLogger.error('[CATCH_ADDRESS_INPUT HANDLER] Error sending confirmation DM:', e);
      }

      // Resume pending tip if exists
      const key = `pending_tip:${userId}`;
      const pending = await runtime.cacheManager.get<Memory>(key);
      if (pending) {
        await runtime.cacheManager.delete(key);
        elizaLogger.info(`[CATCH_ADDRESS_INPUT HANDLER] Resuming pending tip for ${userId}`);
        
        const resumeMemory: Memory = {
          ...pending,
          content: {
            text: (pending.content as any).text ?? '',
            action: 'TIP_TELEGRAM_USER',
          }
        };
        await runtime.processActions(resumeMemory, [resumeMemory], state, callback);
      } else {
        elizaLogger.info(`[CATCH_ADDRESS_INPUT HANDLER] No pending tip found for ${userId}`);
      }
      return [];
    } catch (error) {
      elizaLogger.error('[CATCH_ADDRESS_INPUT HANDLER] Error storing address:', error);
      return []; 
    }
  },
}; 