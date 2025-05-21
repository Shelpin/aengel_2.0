// Export SDK types
// import { Universal, MemoryAccount } from '@aeternity/aepp-sdk';
// import { Universal, MemoryAccount } from '/root/aepp-sdk-js/dist';
import { Universal, MemoryAccount } from '@aeternity/aepp-sdk';

/**
 * Wallet security levels from low to high
 */
export enum WalletSecurityLevel {
  LOW = 'low',       // Not encrypted (not recommended for production)
  MEDIUM = 'medium', // Basic encryption
  HIGH = 'high',     // Strong encryption
  TEE = 'tee'        // Trusted Execution Environment (if available)
}

/**
 * Base interface for wallet providers
 */
export interface WalletProvider {
  getAddress(): Promise<string>;
  getBalance(): Promise<string>;
  signTransaction(tx: any): Promise<string>;
  signMessage(message: string): Promise<string>;
  signTypedData(data: any): Promise<string>;
  signDelegation(delegation: any): Promise<string>;
  getClient(): Universal;
}

/**
 * Transaction types supported by the SDK
 */
export enum TransactionType {
  AE_TRANSFER = 'ae_transfer',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_DEPLOY = 'contract_deploy',
  NAME_PRECLAIM = 'name_preclaim',
  NAME_CLAIM = 'name_claim',
  NAME_UPDATE = 'name_update',
  NAME_TRANSFER = 'name_transfer',
  NAME_REVOKE = 'name_revoke',
  ORACLE_REGISTER = 'oracle_register',
  ORACLE_EXTEND = 'oracle_extend',
  ORACLE_QUERY = 'oracle_query',
  ORACLE_RESPOND = 'oracle_respond',
}

/**
 * Transaction result object
 */
export interface TransactionResult {
  hash: string;
  status: 'success' | 'error';
  blockHash?: string;
  blockHeight?: number;
  error?: string;
}

/**
 * Optional transaction parameters
 */
export interface TransactionOptions {
  ttl?: number;
  fee?: string;
  nonce?: number;
  gas?: number;
}

/**
 * AE token transfer parameters
 */
export interface AeTransferParams {
  recipient: string;
  amount: string;
  options?: TransactionOptions;
}

/**
 * Token info object
 */
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  contractId?: string;
}

/**
 * Token transfer parameters
 */
export interface TokenTransferParams {
  token: string;      // Token contract ID
  recipient: string;  // Recipient address
  amount: string;     // Amount in token's smallest unit
  options?: TransactionOptions;
}

/**
 * Contract call parameters
 */
export interface ContractCallParams {
  contractId: string;
  functionName: string;
  args: any[];
  options?: TransactionOptions;
}

/**
 * Pending tip object
 */
export interface PendingTip {
  recipient: string;
  amount: string;
  message?: string;
  requestedAt: string;
  expiresAt?: string;
}

/**
 * User address mapping
 */
export interface UserAddressMapping {
  username: string;
  address: string;
  updatedAt: string;
}

/**
 * Telegram client interface
 */
export interface TelegramClient {
  sendDirectMessage(username: string, message: string): Promise<boolean>;
  sendMessage?: (chatId: string, message: string) => Promise<boolean>;
} 