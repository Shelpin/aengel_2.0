import type { Plugin, IAgentRuntime, Memory, Handler, ServiceType, Action, State } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import { processAddressRegistrationAction } from './actions/processAddressRegistration';
import { catchAddressInputAction } from './actions/catchAddressInput';
import { tipTelegramUser, tipTelegramUserSchema, TipTelegramUserInput, TipTelegramUserOutput } from './actions/tipTelegramUser';
import { UserAddressService } from './services/UserAddressService';
import { AeternityWalletService } from './services/AeternityWalletService';
import { ContributionAnalyzerService } from './services/ContributionAnalyzerService';

// Create adapter function to match the Handler type expected by ElizaOS
const createHandlerAdapter = (
  impl: (input: TipTelegramUserInput, context: {
    runtime: IAgentRuntime;
    message?: Memory;
    state?: State;
    callback?: any;
  }) => Promise<TipTelegramUserOutput>
): Handler => {
  return async (
    runtime: IAgentRuntime,
    memory?: Memory,
    _options?: any,
    callback?: any
  ) => {
    try {
      // Extract input data from memory.content which could be structured in different ways
      let input: TipTelegramUserInput | undefined;
      
      if (memory?.content) {
        if (typeof memory.content === 'object') {
          // Try to extract parameters from various possible content structures
          const content = memory.content as any;
          
          if (content.action && typeof content.action === 'object' && 'parameters' in content.action) {
            input = content.action.parameters as TipTelegramUserInput;
          } else if ('parameters' in content) {
            input = content.parameters as TipTelegramUserInput;
          } else if ('text' in content && typeof content.text === 'string') {
            try {
              const parsed = JSON.parse(content.text);
              input = parsed as TipTelegramUserInput;
            } catch (e) {
              // Not valid JSON, continue to error handling
            }
          }
        }
      }
      
      if (!input) {
        return {
          success: false,
          error: 'Missing tip parameters in action'
        };
      }
      
      // Create an empty state object since we don't know if runtime.state exists
      // This avoids non-idiomatic access with runtime['state']
      const state: State = {
        bio: '',
        lore: '',
        messageDirections: '',
        postDirections: '',
        roomId: memory?.roomId || '',
        recentMessages: '',
        recentMessagesData: [],
        actors: '',
        ...((runtime as any).state || {}) // Safely access state if it exists
      };
      
      // Call implementation with properly structured context
      return await impl(input, { runtime, message: memory, state, callback });
    } catch (error) {
      elizaLogger.error(`Handler adapter error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in handler adapter'
      };
    }
  };
};

// Define tipTelegramUserAction with properties matching the Action interface
const tipTelegramUserAction: Action = {
  name: 'TIP_TELEGRAM_USER',
  description: 'Sends a tip to a Telegram user on the Aeternity blockchain.',
  examples: [],
  similes: [], // Required by Action interface
  validate: async (runtime: IAgentRuntime, memory: Memory): Promise<boolean> => {
    elizaLogger.debug('[TIP_TELEGRAM_USER VALIDATE] Entered validation.');
    return true; 
  },
  handler: createHandlerAdapter(tipTelegramUser)
};

// Ensure processAddressRegistrationAction matches Action interface
const processActionWithEmptyExamples: Action = {
  ...processAddressRegistrationAction,
  examples: [],
  similes: processAddressRegistrationAction.similes || []
};

// Ensure catchAddressInputAction matches Action interface
const catchActionWithEmptyExamples: Action = {
  ...catchAddressInputAction, 
  examples: [],
  similes: catchAddressInputAction.similes || []
};

// Create service instances that will be shared
const userAddressService = new UserAddressService();
const aeternityWalletService = new AeternityWalletService();
const contributionAnalyzerService = new ContributionAnalyzerService({
  minor: '0.1',
  helpful: '0.5',
  valuable: '1.0',
  major: '2.5',
  exceptional: '5.0'
});

// Log service initialization status for debugging
elizaLogger.info('[plugin-aeternity] Creating services...');

// Add proper initialization to each service
userAddressService.initialize = async (runtime: IAgentRuntime): Promise<void> => {
  elizaLogger.info('[UserAddressService] Initializing...');
  
  // Each service might already have its own initialization logic
  // We're just patching the method here, not trying to call runtime.registerService
  
  elizaLogger.info('[UserAddressService] Initialized successfully');
};

aeternityWalletService.initialize = async (runtime: IAgentRuntime): Promise<void> => {
  elizaLogger.info('[AeternityWalletService] Initializing...');
  
  // Each service might already have its own initialization logic
  // We're just patching the method here, not trying to call runtime.registerService
  
  elizaLogger.info('[AeternityWalletService] Initialized successfully');
};

contributionAnalyzerService.initialize = async (runtime: IAgentRuntime): Promise<void> => {
  elizaLogger.info('[ContributionAnalyzerService] Initializing...');
  
  // Safely store runtime reference if needed
  if (runtime) {
    // Safely set runtime property without using 'this'
    (contributionAnalyzerService as any).runtime = runtime;
  }
  
  elizaLogger.info('[ContributionAnalyzerService] Initialized successfully');
};

// Enhanced plugin descriptor with proper interface
const plugin: Plugin = {
  name: 'plugin-aeternity',
  description: 'Aeternity blockchain tipping plugin for Telegram',
  actions: [
    processActionWithEmptyExamples,
    catchActionWithEmptyExamples,
    tipTelegramUserAction
  ],
  services: [
    userAddressService,
    aeternityWalletService,
    contributionAnalyzerService
  ]
};

// Export service instances for potential direct access
export { userAddressService, aeternityWalletService, contributionAnalyzerService };

// Export both named and default exports for maximum compatibility
export { plugin };
export default plugin;
