import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Define environment schema for Aeternity plugin
export const aeternityEnvSchema = z.object({
  // Wallet secret key (raw mnemonic, hex, or base58)
  AETERNITY_SECRET_KEY: z.string(),
  
  // Public address
  AE_WALLET_ADDRESS: z.string().optional(),
  
  // Salt for encryption/decryption
  WALLET_SECRET_SALT: z.string().optional(),
  
  // Network node URL
  AETERNITY_NODE_URL: z.string().default('https://mainnet.aeternity.io'),
  
  // Compiler URL for smart contracts
  AETERNITY_COMPILER_URL: z.string().default('https://compiler.aeternity.io'),
  
  // Network ID
  AETERNITY_NETWORK_ID: z.string().default('ae_mainnet'),
  
  // Explorer API URL
  AETERNITY_EXPLORER_URL: z.string().default('https://explorer.aeternity.io/api'),
});

// Environment type derived from schema
export type AeternityEnv = z.infer<typeof aeternityEnvSchema>;

// Load environment variables
export const loadEnvironment = (): AeternityEnv => {
  return aeternityEnvSchema.parse(process.env);
};

// Export environment variables
export const env = loadEnvironment();
