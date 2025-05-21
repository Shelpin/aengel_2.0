import { z } from 'zod';
import { ServiceType } from '@elizaos/core';
import { AeternityWalletService } from '../services/AeternityWalletService';
import { TransactionService } from '../services/transactionService';
import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';

// Input schema for transferAe action
export const transferAeSchema = z.object({
  // Recipient address
  recipient: z.string().min(1),
  
  // Amount to transfer
  amount: z.string().min(1),
  
  // Optional transaction parameters
  options: z
    .object({
      nonce: z.number().optional(),
      ttl: z.number().optional(),
      fee: z.string().optional(),
    })
    .optional(),
});

// Input type derived from schema
export type TransferAeInput = z.infer<typeof transferAeSchema>;

// Output type for transferAe action
export type TransferAeOutput = {
  success: boolean;
  hash?: string;
  error?: string;
};

/**
 * Transfer AE tokens to a recipient
 * @param input - Transfer parameters
 * @param context - Action context
 * @returns Transaction result
 */
export const transferAe = async (
  input: TransferAeInput,
  context: any
): Promise<TransferAeOutput> => {
  try {
    // Validate input
    const params = transferAeSchema.parse(input);
    
    // Retrieve the wallet service from runtime
    const walletService = context.runtime.getService(ServiceType.TEXT_GENERATION) as AeternityWalletService;
    const transactionService = new TransactionService(walletService);
    
    // Execute transfer
    const result = await transactionService.transferAe({
      recipient: params.recipient,
      amount: params.amount,
      options: params.options,
    });
    
    // Return result
    if (result.status === 'success') {
      return {
        success: true,
        hash: result.hash,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Failed to transfer AE:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Action descriptor for transferAe
export const transferAeAction: Action = {
  name: 'TRANSFER_AE',
  similes: ['TRANSFER_AE'],
  description: 'Transfer AE tokens to a recipient',
  examples: [
    {
      input: {
        recipient: "ak_2buwmB9YM81jiXEECXcfpw6D7kp4RNixzDc5wWqHcqFymcacKP",
        amount: "1.5",
        options: {
          fee: "0.00002"
        }
      },
      output: {
        success: true,
        hash: "th_exampleTransactionHash123456"
      }
    }
  ],
  validate: async (runtime: IAgentRuntime) => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    callback?: HandlerCallback
  ) => {
    const content = message.content as any;
    const input = transferAeSchema.parse({ ...(content as Record<string, any>) });
    const result = await transferAe(input, { runtime });
    if (callback) {
      await callback({ text: result.success ? `Transfer successful: ${result.hash}` : `Error: ${result.error}` });
    }
    return result.success;
  },
}; 