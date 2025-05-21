import axios from 'axios';
import { AeternityWalletProvider } from '../providers/walletProvider';
import { env } from '../environment';
import { TransactionResult, AeTransferParams, ContractCallParams } from '../types';

/**
 * Service for handling Aeternity blockchain transactions
 */
export class TransactionService {
  private walletProvider: AeternityWalletProvider;
  
  /**
   * Create a new TransactionService instance
   * @param walletProvider - The wallet provider
   */
  constructor(walletProvider: AeternityWalletProvider) {
    this.walletProvider = walletProvider;
  }
  
  /**
   * Transfer AE tokens to a recipient
   * @param params - Transfer parameters
   * @returns Transaction result
   */
  public async transferAe(params: AeTransferParams): Promise<TransactionResult> {
    try {
      const client = this.walletProvider.getClient();
      // Some SDK versions use `spend`, others use `transfer`
      const sendFn = (client as any).spend ?? (client as any).transfer;
      if (typeof sendFn !== 'function') {
        throw new Error('Aeternity client has no spend or transfer method');
      }
      const tx = await sendFn.call(client, params.amount, params.recipient, {
        ttl: params.options?.ttl,
        nonce: params.options?.nonce,
      });
      
      // Check transaction status
      return {
        hash: tx.hash,
        status: 'success',
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
      };
    } catch (error) {
      console.error('Failed to transfer AE:', error);
      return {
        hash: '',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Call a contract function
   * @param params - Contract call parameters
   * @returns Transaction result
   */
  public async callContract(params: ContractCallParams): Promise<TransactionResult> {
    try {
      const client = this.walletProvider.getClient();
      
      // Create contract instance - using type assertion for compatibility
      // Note: Method names may vary between SDK versions
      const contract = await (client as any).getContractInstance({
        contractAddress: params.contractId,
      });
      
      // Call contract function
      const result = await contract.call(params.functionName, params.args, {
        ttl: params.options?.ttl,
        nonce: params.options?.nonce,
        fee: params.options?.fee,
        gas: params.options?.gas,
      });
      
      return {
        hash: result.hash,
        status: 'success',
        blockHash: result.blockHash,
        blockHeight: result.blockHeight,
      };
    } catch (error) {
      console.error('Failed to call contract:', error);
      return {
        hash: '',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Get transaction details from the explorer
   * @param hash - Transaction hash
   * @returns Transaction details
   */
  public async getTransactionDetails(hash: string): Promise<any> {
    try {
      const response = await axios.get(`${env.AETERNITY_EXPLORER_URL}/v2/transactions/${hash}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      throw error;
    }
  }
  
  /**
   * Check if a transaction is confirmed
   * @param hash - Transaction hash
   * @returns Whether the transaction is confirmed
   */
  public async isTransactionConfirmed(hash: string): Promise<boolean> {
    try {
      const details = await this.getTransactionDetails(hash);
      return details.confirmations > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Estimate fee for a transaction
   * @param tx - Transaction object
   * @returns Estimated fee
   */
  public async estimateFee(tx: any): Promise<string> {
    try {
      const client = this.walletProvider.getClient();
      // Using type assertion for compatibility with different SDK versions
      const fee = await (client as any).estimateFee(tx);
      return fee;
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      throw error;
    }
  }
} 