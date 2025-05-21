import { z } from 'zod';
import { AeternityWalletProvider } from '../providers/walletProvider';
import { WalletSecurityLevel } from '../types';

// Input schema for generateKeyPair action
export const generateKeyPairSchema = z.object({
  // Password for encrypting the private key
  password: z.string().min(8),
  
  // Optional security level
  securityLevel: z
    .enum([
      WalletSecurityLevel.LOW,
      WalletSecurityLevel.MEDIUM,
      WalletSecurityLevel.HIGH,
      WalletSecurityLevel.TEE,
    ])
    .optional()
    .default(WalletSecurityLevel.HIGH),
});

// Input type derived from schema
export type GenerateKeyPairInput = z.infer<typeof generateKeyPairSchema>;

// Output type for generateKeyPair action
export type GenerateKeyPairOutput = {
  success: boolean;
  publicKey?: string;
  encryptedPrivateKey?: string;
  error?: string;
};

/**
 * Generate a new key pair with encryption
 * @param input - Generation parameters
 * @returns Generated key pair with encrypted private key
 */
export const generateKeyPair = async (
  input: GenerateKeyPairInput
): Promise<GenerateKeyPairOutput> => {
  try {
    // Validate input
    const params = generateKeyPairSchema.parse(input);
    
    // Generate key pair
    const keyPair = await AeternityWalletProvider.generateKeyPair(params.password);
    
    return {
      success: true,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: keyPair.encryptedPrivateKey,
    };
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Action descriptor for generateKeyPair
 */
export const generateKeyPairAction = {
  name: 'GENERATE_KEY_PAIR',
  description: 'Generate a secure Aeternity key pair with encryption',
  inputSchema: generateKeyPairSchema,
  execute: generateKeyPair,
  examples: [
    {
      input: {
        password: "secure_password_example",
        securityLevel: "high"
      },
      output: {
        success: true,
        publicKey: "ak_examplePublicKey123456",
        encryptedPrivateKey: "encrypted_key_data_example"
      }
    }
  ]
}; 