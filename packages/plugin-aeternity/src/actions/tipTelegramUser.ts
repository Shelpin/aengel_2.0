import { z } from 'zod';
import { ServiceType, IAgentRuntime, HandlerCallback, Memory, State, Action } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import { AeternityWalletService } from '../services/AeternityWalletService';
import { UserAddressService } from '../services/UserAddressService';
import { ContributionAnalyzerService, ContributionLevel } from '../services/ContributionAnalyzerService';
import { PendingTip, TelegramClient } from '../types';

// Input schema for tipTelegramUser action
export const tipTelegramUserSchema = z.object({
  // Telegram username or wallet address
  recipient: z.string().min(1),
  
  // Amount to tip in AE (optional if contributionDescription is provided)
  amount: z.string().optional(),
  
  // Description of the contribution (used to determine tip amount if not explicitly provided)
  contributionDescription: z.string().optional(),
  
  // Optional message to include with the tip
  message: z.string().optional(),
  
  // Optional transaction parameters
  options: z
    .object({
      fee: z.string().optional(),
    })
    .optional(),
  
  // Optional chat ID for group notifications
  chatId: z.string().optional(),
  
  // Optional flag to force tip even if LLM evaluation says it's not deserved
  forceTip: z.boolean().optional(),
});

// Input type derived from schema
export type TipTelegramUserInput = z.infer<typeof tipTelegramUserSchema>;

// Output type for tipTelegramUser action
export type TipTelegramUserOutput = {
  success: boolean;
  hash?: string;
  error?: string;
  message?: string;
  pendingAddressRequest?: boolean; // Indicates we're waiting for user to provide address
  contributionLevel?: string; // The analyzed contribution level if applicable
  tipAmount?: string; // The amount that was tipped
  deservedTip?: boolean; // Whether the LLM determined the contribution deserved a tip
  reasonForTip?: string; // LLM reasoning for the tip decision
};

/**
 * Helper function to get services in a more robust way
 * Tries multiple approaches to locate the required services
 * @param runtime The ElizaOS runtime
 * @returns Object containing discovered services
 */
const getServices = async (runtime: IAgentRuntime) => {
  const logger = elizaLogger;
  let userAddressService = null;
  let aeternityWallet = null;
  let contributionAnalyzer = null;
  
  logger.debug('Starting robust service discovery...');
  
  // Method 1: Direct service access via services Map
  if (runtime.services instanceof Map) {
    logger.debug('Looking for services in runtime.services Map...');
    
    userAddressService = runtime.services.get('user_address' as ServiceType);
    if (userAddressService) {
      logger.debug('Found UserAddressService in runtime.services Map');
    }
    
    aeternityWallet = runtime.services.get('aeternity_wallet' as ServiceType);
    if (aeternityWallet) {
      logger.debug('Found AeternityWalletService in runtime.services Map');
    }
    
    contributionAnalyzer = runtime.services.get('text_generation' as ServiceType);
    if (contributionAnalyzer) {
      logger.debug('Found ContributionAnalyzerService in runtime.services Map');
    }
  }
  
  // Method 2: Check for getService method
  if ((!userAddressService || !aeternityWallet) && typeof runtime.getService === 'function') {
    logger.debug('Attempting to get services using runtime.getService()...');
    
    if (!userAddressService) {
      try {
        userAddressService = await runtime.getService('user_address' as ServiceType);
        if (userAddressService) {
          logger.debug('Found UserAddressService via getService()');
        }
      } catch (error) {
        logger.warn(`Failed to get UserAddressService via getService(): ${error}`);
      }
    }
    
    if (!aeternityWallet) {
      try {
        aeternityWallet = await runtime.getService('aeternity_wallet' as ServiceType);
        if (aeternityWallet) {
          logger.debug('Found AeternityWalletService via getService()');
        }
      } catch (error) {
        logger.warn(`Failed to get AeternityWalletService via getService(): ${error}`);
      }
    }
    
    if (!contributionAnalyzer) {
      try {
        contributionAnalyzer = await runtime.getService('text_generation' as ServiceType);
        if (contributionAnalyzer) {
          logger.debug('Found ContributionAnalyzerService via getService()');
        }
      } catch (error) {
        logger.warn(`Failed to get ContributionAnalyzerService via getService(): ${error}`);
      }
    }
  }
  
  // Method 3: Duck typing on services object values
  if ((!userAddressService || !aeternityWallet) && runtime.services && typeof runtime.services === 'object') {
    logger.debug('Looking for services using duck typing...');
    
    // Convert services to an array of values if it's not already iterable
    const services = runtime.services instanceof Map 
      ? Array.from(runtime.services.values())
      : Object.values(runtime.services);
    
    for (const service of services) {
      if (!service) continue;
      
      // Type identification through duck typing
      if (!userAddressService && typeof (service as any).getAddress === 'function') {
        userAddressService = service;
        logger.debug('Found UserAddressService through duck typing');
      }
      
      if (!aeternityWallet && typeof (service as any).sendTransaction === 'function') {
        aeternityWallet = service;
        logger.debug('Found AeternityWalletService through duck typing');
      }
      
      if (!contributionAnalyzer && typeof (service as any).analyzeContribution === 'function') {
        contributionAnalyzer = service;
        logger.debug('Found ContributionAnalyzerService through duck typing');
      }
    }
  }
  
  // Method 4: Look in plugins array
  if ((!userAddressService || !aeternityWallet) && Array.isArray(runtime.plugins)) {
    logger.debug('Attempting to find services in runtime.plugins...');
    
    // Find our plugin by name
    const aePlugin = runtime.plugins.find((p: any) => 
      p && (p.name === 'plugin-aeternity' || p.name === '@elizaos/plugin-aeternity')
    );
    
    if (aePlugin && Array.isArray(aePlugin.services)) {
      logger.debug('Found Aeternity plugin. Checking its services...');
      
      // Find services in the plugin by function signatures
      for (const service of aePlugin.services) {
        if (!service) continue;
        
        if (!userAddressService && typeof (service as any).getAddress === 'function') {
          userAddressService = service;
          logger.debug('Found UserAddressService in plugin services');
        }
        
        if (!aeternityWallet && typeof (service as any).sendTransaction === 'function') {
          aeternityWallet = service;
          logger.debug('Found AeternityWalletService in plugin services');
        }
        
        if (!contributionAnalyzer && typeof (service as any).analyzeContribution === 'function') {
          contributionAnalyzer = service;
          logger.debug('Found ContributionAnalyzerService in plugin services');
        }
      }
    }
  }
  
  // Method 5: Try importing directly from the module (last resort)
  if (!userAddressService || !aeternityWallet) {
    logger.debug('Attempting to import services directly as last resort...');
    
    try {
      // Use dynamic import to avoid build-time dependencies
      const { userAddressService: us, aeternityWalletService: aw, contributionAnalyzerService: ca } =
        // The path might need adjustment depending on your build setup
        await import('../index.js');
      
      userAddressService = userAddressService || us;
      aeternityWallet = aeternityWallet || aw;
      contributionAnalyzer = contributionAnalyzer || ca;
      
      if (userAddressService || aeternityWallet || contributionAnalyzer) {
        logger.debug('Successfully imported one or more services directly from module');
      }
    } catch (importError) {
      logger.error(`Failed to import services directly: ${importError}`);
    }
  }
  
  // Log discovery results
  logger.info(`Service discovery results: UserAddressService: ${!!userAddressService}, AeternityWalletService: ${!!aeternityWallet}, ContributionAnalyzerService: ${!!contributionAnalyzer}`);
  
  return { 
    userAddressService: userAddressService as UserAddressService, 
    aeternityWallet: aeternityWallet as AeternityWalletService, 
    contributionAnalyzer: contributionAnalyzer as ContributionAnalyzerService
  };
};

/**
 * Resolves a Telegram username to an Aeternity address
 * @param username - Telegram username or already valid Aeternity address
 * @param userAddressService - Service to lookup username-to-address mappings
 * @param runtime - Runtime for logging
 * @param telegramClient - Optional Telegram client to request address if not found
 * @param chatId - Optional chat ID for group notifications
 * @returns Aeternity address, null if requesting address via DM, or throws error
 */
const resolveAddress = async (
  username: string, 
  userAddressService: UserAddressService,
  runtime: IAgentRuntime,
  telegramClient?: TelegramClient,
  chatId?: string
): Promise<string | null> => {
  // Use consistent logger
  const logger = elizaLogger;
  
  // If input is already an AE address, return it directly
  if (username.startsWith('ak_')) {
    logger.debug(`Username "${username}" is already an Aeternity address, using directly`);
    return username;
  }
  
  // Clean username (remove @ if present)
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  try {
    // Try to get address from service
    const address = await userAddressService.getAddress(cleanUsername);
    if (address) {
      logger.debug(`Address found for ${cleanUsername}: ${address}`);
      return address;
    }
    
    logger.debug(`Address not found locally for ${cleanUsername}. Requesting via Telegram.`);
    
    // If no address found and Telegram client available, send DM request
    if (telegramClient) {
      try {
        await telegramClient.sendDirectMessage(
          cleanUsername,
          `Hello from the Aeternity tipping bot! Someone wants to send you a tip. Please reply with your Aeternity (AE) wallet address (ak_...).`
        );
        logger.info(`Sent address request DM to ${cleanUsername}`);
        
        // If in a group chat, send notification there too
        if (chatId && telegramClient.sendMessage) {
          await telegramClient.sendMessage(
            chatId,
            `@${cleanUsername}, please check your DMs for instructions on how to receive your AE tip!`
          );
          logger.info(`Sent group notification about DM in chat ${chatId}`);
        }
        return null; // Indicate we're waiting for address
      } catch (error: any) {
        logger.error(`Failed to send DM to @${cleanUsername}: ${error.message}`, { 
          errorObject: error, 
          stack: error.stack, 
          details: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        throw new Error(`Could not request address from @${cleanUsername}`);
      }
    } else {
      logger.warn(`No address found for @${cleanUsername} and no Telegram client available.`);
      throw new Error(`No address found for @${cleanUsername} and no Telegram client available to request it`);
    }
  } catch (error: any) {
    logger.error(`Error resolving address for ${cleanUsername}: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Determine the appropriate tip amount based on input and LLM analysis
 * @param params - Tip parameters
 * @param contributionAnalyzer - Contribution analyzer service
 * @param runtime - Runtime for logging
 * @returns Object containing determined tip amount and metadata
 */
const determineTipAmount = async (
  params: TipTelegramUserInput, 
  contributionAnalyzer: ContributionAnalyzerService | undefined,
  runtime: IAgentRuntime
): Promise<{
  amount: string,
  contributionLevel?: string,
  deservedTip?: boolean,
  reasonForTip?: string
}> => {
  // Use consistent logger
  const logger = elizaLogger;
  
  // If explicit amount is provided, use it directly
  if (params.amount) {
    logger.debug(`Using explicit tip amount: ${params.amount}`);
    let metadata: { contributionLevel?: string, deservedTip?: boolean, reasonForTip?: string } = {};
    
    // If we have a contribution description and analyzer, add analysis metadata
    if (params.contributionDescription && contributionAnalyzer) {
      try {
        metadata.contributionLevel = await contributionAnalyzer.analyzeContribution(params.contributionDescription);
        metadata.deservedTip = params.forceTip || await contributionAnalyzer.shouldTip(params.contributionDescription);
        metadata.reasonForTip = await contributionAnalyzer.getTipReasoning(params.contributionDescription);
        logger.debug('Contribution analysis metadata (explicit amount): ', metadata);
      } catch (error: any) {
        logger.error(`Error analyzing contribution for metadata: ${error.message}`, error);
      }
    }
    return { amount: params.amount, ...metadata };
  }
  
  // Handle cases where contribution description exists and we have an analyzer
  if (params.contributionDescription && contributionAnalyzer) {
    logger.debug(`Determining tip amount based on contribution: "${params.contributionDescription}"`);
    try {
      const deservedTip = params.forceTip || await contributionAnalyzer.shouldTip(params.contributionDescription);
      const reasonForTip = await contributionAnalyzer.getTipReasoning(params.contributionDescription);
      logger.debug(`Contribution deserved tip: ${deservedTip}, Force tip: ${params.forceTip}`);

      if (!deservedTip && !params.forceTip) {
        logger.info('Contribution does not meet criteria for a significant tip, using minimum.');
        return { 
          amount: contributionAnalyzer.getTipAmount(ContributionLevel.MINOR),
          contributionLevel: ContributionLevel.MINOR,
          deservedTip: false,
          reasonForTip: reasonForTip || 'Contribution does not meet criteria for a significant tip'
        };
      }
      
      const level = await contributionAnalyzer.analyzeContribution(params.contributionDescription);
      const amount = contributionAnalyzer.getTipAmount(level);
      logger.info(`Contribution level: ${level}, Recommended tip amount: ${amount} AE`);
      
      return {
        amount,
        contributionLevel: level,
        deservedTip: true,
        reasonForTip
      };
    } catch (error: any) {
      logger.error(`Error determining tip amount with analyzer: ${error.message}`, error);
    }
  }
  
  // Default case - no amount or contribution description or analyzer
  const defaultAmount = '0.5';
  logger.info(`Using default amount: ${defaultAmount} AE (${!params.contributionDescription ? 'no contribution description' : 'no analyzer available'})`);
  return { 
    amount: defaultAmount,
    reasonForTip: params.forceTip ? 'Manual tip request' : 'Default tip amount used'
  };
};

/**
 * Send a tip to a Telegram user
 * @param input - Tipping parameters
 * @param context - Action context
 * @returns Transaction result
 */
export const tipTelegramUser = async (
  input: TipTelegramUserInput,
  context: {
    runtime: IAgentRuntime;
    message?: Memory;
    state?: State;
    callback?: HandlerCallback;
  }
): Promise<TipTelegramUserOutput> => {
  // Use consistent logger across all scenarios
  const runtime = context.runtime;
  const logger = elizaLogger;
  
  logger.info('Starting tipTelegramUser action handler with robust service discovery...', input);

  try {
    // SIMPLIFIED CHECK: No longer checking for runtime.getService
    if (!runtime) {
      throw new Error('Invalid runtime');
    }
    
    // Debug log what we have available in the runtime
    logger.debug('Runtime received:', Object.keys(runtime));
    
    // Get required services using our robust discovery method
    const { userAddressService, aeternityWallet, contributionAnalyzer } = await getServices(runtime);
    
    if (!userAddressService || !aeternityWallet) {
      throw new Error(`Required services not available. Found: UserAddressService: ${!!userAddressService}, AeternityWalletService: ${!!aeternityWallet}`);
    }
    
    logger.info('Successfully located required services for tipping');
    
    // Get telegram client with fallbacks
    let telegramClient = null;
    
    // Method 1: Check clients object
    if (runtime.clients && runtime.clients.telegram) {
      telegramClient = runtime.clients.telegram;
      logger.debug('Retrieved Telegram client from runtime.clients.telegram');
    }
    
    // Method 2: Try getClient method if available
    if (!telegramClient && 'getClient' in runtime && typeof (runtime as any).getClient === 'function') {
      try {
        telegramClient = await (runtime as any).getClient('telegram');
        logger.debug('Retrieved Telegram client using runtime.getClient()');
      } catch (error) {
        logger.warn(`Failed to get Telegram client via getClient(): ${error}`);
      }
    }

    // Check if address is missing AND telegram client is unavailable BEFORE calling resolveAddress
    const cleanRecipientForCheck = input.recipient.startsWith('@') ? input.recipient.substring(1) : input.recipient;
    const initialAddress = await userAddressService.getAddress(cleanRecipientForCheck);

    if (!initialAddress && !telegramClient) {
      logger.warn(`Address not found for ${cleanRecipientForCheck} and Telegram client is not available. Cannot request address.`);
      return {
        success: false,
        error: `Address for ${input.recipient} is not registered, and the bot cannot currently request it. Please register your address manually.`,
        pendingAddressRequest: true,
      };
    }

    // 1. Resolve recipient address
    logger.debug(`Resolving address for recipient: ${input.recipient}`);
    const recipientAddress = await resolveAddress(
      input.recipient,
      userAddressService,
      runtime,
      telegramClient,
      input.chatId
    );

    if (recipientAddress === null) {
      logger.info(`Waiting for address from user: ${input.recipient}`);
      return {
        success: false,
        message: `Requested address from ${input.recipient}. Tip will be sent once address is provided.`,
        pendingAddressRequest: true,
      };
    }
    logger.info(`Resolved recipient address: ${recipientAddress}`);

    // 2. Determine tip amount
    logger.debug('Determining tip amount...');
    const { amount: tipAmount, contributionLevel, deservedTip, reasonForTip } = await determineTipAmount(
      input,
      contributionAnalyzer,
      runtime
    );
    logger.info(`Determined tip amount: ${tipAmount} AE`, { contributionLevel, deservedTip });

    // 3. Send the transaction using the wallet service
    logger.info(`Attempting to send ${tipAmount} AE to ${recipientAddress}...`);
    const txHash = await aeternityWallet.sendTransaction(
      recipientAddress,
      tipAmount,
      input.message
    );
    logger.info(`Transaction sent successfully! Hash: ${txHash}`);

    // 4. Return success result
    return {
      success: true,
      hash: txHash,
      message: `Successfully sent ${tipAmount} AE tip to ${input.recipient} (${recipientAddress}). Transaction hash: ${txHash}`,
      contributionLevel,
      tipAmount,
      deservedTip,
      reasonForTip,
    };

  } catch (error: any) {
    logger.error(`Error in tipTelegramUser action: ${error.message}`, { stack: error.stack });
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during tipping.',
    };
  }
};

// NO Action object definition here. This file should only export the handler and related types/schemas.
// The Action object (tipTelegramUserAction) will be defined in plugin-aeternity/src/index.ts 