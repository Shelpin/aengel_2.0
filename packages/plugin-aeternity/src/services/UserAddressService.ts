import { UserAddressMapping, PendingTip } from '../types';
import { Service, ServiceType, IAgentRuntime, elizaLogger } from '@elizaos/core';

/**
 * Service for managing Telegram username to Aeternity address mappings
 * and handling pending tips.
 */
export class UserAddressService extends Service {
  // Use custom service type for this service
  static get serviceType(): ServiceType { return 'user_address' as ServiceType; }
  private runtime!: IAgentRuntime;
  private logger: any;
  
  /**
   * Capture the runtime for later cache access
   */
  public async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    // Use elizaLogger as fallback if runtime.logger is undefined
    this.logger = runtime?.logger || elizaLogger;
    this.logger.info('[UserAddressService] Initialized');
  }
  
  /**
   * Retrieve stored Aeternity address for a username
   */
  public async getAddress(username: string): Promise<string | null> {
    if (!username) {
      this.logger.warn('[UserAddressService] getAddress called with empty username');
      return null;
    }
    
    const key = `wallet:${this.cleanUsername(username)}`;
    try {
      if (!this.runtime?.cacheManager) {
        this.logger.error('[UserAddressService] No cacheManager available in runtime');
        return null;
      }
      
      const address = await this.runtime.cacheManager.get<string>(key);
      this.logger.info(`[UserAddressService] getAddress ${key} → ${address || 'null'}`);
      return address ?? null;
    } catch (error) {
      this.logger.error(`[UserAddressService] Error getting address for ${key}: ${error}`);
      return null;
    }
  }
  
  /**
   * Store Aeternity address for a username
   */
  public async setAddress(username: string, address: string): Promise<void> {
    if (!username) {
      this.logger.warn('[UserAddressService] setAddress called with empty username');
      return;
    }
    
    if (!address) {
      this.logger.warn('[UserAddressService] setAddress called with empty address');
      return;
    }
    
    const key = `wallet:${this.cleanUsername(username)}`;
    try {
      if (!this.runtime?.cacheManager) {
        this.logger.error('[UserAddressService] No cacheManager available in runtime');
        return;
      }
      
      await this.runtime.cacheManager.set(key, address);
      this.logger.info(`[UserAddressService] SUCCESSFULLY set address ${key} → ${address}`);
    } catch (error) {
      this.logger.error(`[UserAddressService] Error setting address for ${key}: ${error}`);
    }
  }
  
  /**
   * Clean a username by removing @ if present and converting to lowercase
   * @param username - Telegram username (with or without @)
   * @returns Cleaned username
   */
  private cleanUsername(username: string): string {
    if (!username) return '';
    return username.startsWith('@')
      ? username.substring(1).toLowerCase()
      : username.toLowerCase();
  }
} 