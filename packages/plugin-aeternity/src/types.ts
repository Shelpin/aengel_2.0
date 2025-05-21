/**
 * Environment variable interface for TypeScript type checking.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AETERNITY_SECRET_KEY: string;
      AETERNITY_NODE_URL: string;
      AETERNITY_COMPILER_URL: string;
      AETERNITY_NETWORK_ID: string;
      AETERNITY_EXPLORER_URL: string;
      AE_WALLET_ADDRESS?: string;
      AE_WALLET_SECRET_KEY?: string; // Added direct secret key option
      AE_WALLET_HD_INDEX?: string; // Added HD wallet index option
      WALLET_SECRET_SALT?: string;
    }
  }
}

export const env = process.env;

// Aeternity wallet provider interface
export interface WalletProvider {
  // Get account address
  getAddress(): Promise<string>;
  
  // Sign a transaction
  signTransaction(tx: any): Promise<string>;
  
  // Sign a message
  signMessage(message: string): Promise<string>;
  
  // Get account balance
  getBalance(): Promise<string>;
}

// Token information interface
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  contractId: string;
  balance?: string;
}

// Transaction result interface
export interface TransactionResult {
  hash: string;
  status: 'success' | 'error' | 'pending';
  blockHash?: string;
  blockHeight?: number;
  confirmations?: number;
  error?: string;
}

// Transaction options interface
export interface TransactionOptions {
  nonce?: number;
  ttl?: number;
  gas?: number;
  gasPrice?: string;
  fee?: string;
}

// Token transfer parameters
export interface TokenTransferParams {
  tokenId: string;
  recipient: string;
  amount: string;
  options?: TransactionOptions;
}

// Native AE transfer parameters
export interface AeTransferParams {
  recipient: string;
  amount: string;
  options?: TransactionOptions;
}

// Contract call parameters
export interface ContractCallParams {
  contractId: string;
  functionName: string;
  args: any[];
  options?: TransactionOptions;
}

// Transaction types
export enum TransactionType {
  SPEND = 'spend',
  CONTRACT_CREATE = 'contractCreate',
  CONTRACT_CALL = 'contractCall',
  NAME_PRECLAIM = 'namePreclaim',
  NAME_CLAIM = 'nameClaim',
  NAME_UPDATE = 'nameUpdate',
  NAME_TRANSFER = 'nameTransfer',
  CHANNEL_CREATE = 'channelCreate',
}

// Wallet security level
export enum WalletSecurityLevel {
  LOW = 'low',       // Unencrypted storage (not recommended)
  MEDIUM = 'medium', // Basic encryption
  HIGH = 'high',     // Strong encryption with additional protections
  TEE = 'tee'        // Trusted Execution Environment (if available)
}

// Pending tip interface
export interface PendingTip {
  recipient: string;    // Telegram username
  amount: string;       // Amount to tip
  message?: string;     // Optional message
  requestedAt: string;  // ISO timestamp
  expiresAt?: string;   // Optional expiration time
}

// User address mapping interface
export interface UserAddressMapping {
  username: string;    // Telegram username (without @)
  address: string;     // Aeternity address
  updatedAt: string;   // Last updated timestamp
}

// Telegram client interface
export interface TelegramClient {
  // Send a direct message to a user
  sendDirectMessage(username: string, message: string): Promise<boolean>;
  
  // Send a message to a group or channel
  sendMessage?(chatId: string, message: string): Promise<boolean>;
  
  // Get user information (optional)
  getUserInfo?(username: string): Promise<any>;
  
  // Check if a user is in a channel (optional)
  isUserInChannel?(username: string, channelId: string): Promise<boolean>;
}
