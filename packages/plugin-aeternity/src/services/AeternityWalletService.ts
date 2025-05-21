import { Service, ServiceType, IAgentRuntime, elizaLogger } from '@elizaos/core';
// Import necessary SDK components explicitly, and the rest via namespace
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: aepp-sdk types missing or incorrect for direct import like this
import { AeSdk, Node, MemoryAccount } from '@aeternity/aepp-sdk';
// Import the entire SDK namespace to find potentially hidden exports
import * as aeSdkUtils from '@aeternity/aepp-sdk';

// HD wallet will be imported dynamically
import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js'; // Keep for potential future use if needed, not for core key derivation
import { env } from '../types';
import { WalletSecurityLevel } from '../types';
// Import the local encoding utility - REMOVED as per expert advice for MemoryAccount
// import { encodePrivateKey } from '../utils/encodeKey';
import { Buffer } from 'buffer'; // Ensure Buffer polyfill/availability if needed in environment
import base58check from 'bs58check'; // Re-add for sk_ encoding


// Augment ServiceType enum to include AETERNITY_WALLET
declare module '@elizaos/core' {
  export enum ServiceType {
    AETERNITY_WALLET = 'aeternity_wallet',
  }
}

/**
 * AeternityWalletService securely manages private keys and provides wallet functionality
 * for interacting with the Æternity blockchain.
 */
export class AeternityWalletService extends Service {
  // Use custom service type for wallet provider
  static get serviceType(): ServiceType { return 'aeternity_wallet' as ServiceType; }

  // Removed private logger; using elizaLogger directly

  // Update client type hint
  private client!: AeSdk;
  private account!: MemoryAccount;
  private securityLevel: WalletSecurityLevel;
  private mockMode = false;
  private runtime!: IAgentRuntime; // Add runtime property
  private privateKey?: string; // store injected private key
  private node!: Node;
  private publicKey!: string;

  constructor(
    privateKey?: string, // Optional private key injection for testing
    securityLevel: WalletSecurityLevel = WalletSecurityLevel.HIGH
  ) {
    super();
    this.privateKey = privateKey;
    this.securityLevel = securityLevel;
    // Defer initialization until runtime.initialize
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    console.log('[TRACE_AE_WALLET] Starting wallet service initialization');
    elizaLogger.info('Initializing Aeternity Wallet Service (v3 logic - local encode)...');
    const nodeUrl = env.AETERNITY_NODE_URL;
    const compilerUrl = env.AETERNITY_COMPILER_URL;
    const rawSecretKey = env.AETERNITY_SECRET_KEY?.trim();

    console.log('[TRACE_AE_WALLET] Configuration:', { 
      nodeUrl: nodeUrl ? 'SET' : 'MISSING', 
      compilerUrl: compilerUrl ? 'SET' : 'MISSING',
      secretKey: rawSecretKey ? 'SET' : 'MISSING',
      configuredAddress: env.AE_WALLET_ADDRESS || 'NOT_SET',
      directSecretKey: env.AE_WALLET_SECRET_KEY ? 'SET' : 'MISSING'
    });

    if (!nodeUrl || !compilerUrl) {
      throw new Error('AETERNITY_NODE_URL and AETERNITY_COMPILER_URL must be provided.');
    }
    if (!rawSecretKey) {
      throw new Error('AETERNITY_SECRET_KEY must be provided.');
    }

    try {
      console.log('[TRACE_AE_WALLET] Creating Node instance');
      this.node = new Node({ url: nodeUrl });
      elizaLogger.info(`Connecting to Aeternity node: ${nodeUrl}`);

      let finalKeyMaterialForMemoryAccount: string = ''; // Initialize to empty string

      // Check if we have a direct secret key for the configured wallet address
      const directSecretKey = env.AE_WALLET_SECRET_KEY?.trim();
      const configuredAddress = env.AE_WALLET_ADDRESS?.trim();
      
      if (directSecretKey && configuredAddress) {
        console.log('[TRACE_AE_WALLET] Using direct secret key path');
        elizaLogger.info('Found AE_WALLET_SECRET_KEY. Using direct secret key instead of deriving from mnemonic.');
        
        let formattedKey = directSecretKey;
        console.log('[TRACE_AE_WALLET] Direct key format check:', {
          isHex: /^[0-9a-fA-F]+$/.test(directSecretKey),
          length: directSecretKey.length,
          isSk: directSecretKey.startsWith('sk_')
        });
        
        // If it's a hex key without sk_ prefix, format it
        if (/^[0-9a-fA-F]+$/.test(directSecretKey) && (directSecretKey.length === 64 || directSecretKey.length === 128)) {
          let rawHexKeyForBuffer: string;
          if (directSecretKey.length === 128) {
            console.log('[TRACE_AE_WALLET] Direct hex key is 64 bytes (128 chars). Taking first 32 bytes');
            elizaLogger.info('Direct hex key is 64 bytes (128 chars). Taking first 32 bytes (64 chars of hex).');
            rawHexKeyForBuffer = directSecretKey.slice(0, 64);
          } else {
            console.log('[TRACE_AE_WALLET] Direct hex key is 32 bytes (64 chars). Using directly');
            elizaLogger.info('Direct hex key is 32 bytes (64 chars). Using directly.');
            rawHexKeyForBuffer = directSecretKey;
          }
          console.log('[TRACE_AE_WALLET] Converting hex to buffer:', { hexLength: rawHexKeyForBuffer.length });
          const keyBuffer = Buffer.from(rawHexKeyForBuffer, 'hex');
          console.log('[TRACE_AE_WALLET] Key buffer created:', { 
            bufferLength: keyBuffer.length,
            isBuffer: Buffer.isBuffer(keyBuffer)
          });
          const base58Encoded = base58check.encode(keyBuffer);
          formattedKey = `sk_${base58Encoded}`;
          console.log('[TRACE_AE_WALLET] Encoded to sk_ format:', { 
            formattedKeyType: typeof formattedKey,
            startsWith: formattedKey.startsWith('sk_'),
            length: formattedKey.length
          });
        }
        
        console.log('[TRACE_AE_WALLET] Initializing MemoryAccount with key material.', {
          keyType: typeof formattedKey,
          isSk: formattedKey.startsWith('sk_'),
          length: formattedKey.length
        });
        
        // Initialize with direct key
        try {
          console.log('[TRACE_AE_WALLET] Creating MemoryAccount...');
          this.account = new MemoryAccount(formattedKey as any);
          this.publicKey = this.account.address;
          console.log('[TRACE_AE_WALLET] MemoryAccount created successfully:', { address: this.publicKey });
        } catch (memoryAccountError) {
          console.error('[TRACE_AE_WALLET] ERROR creating MemoryAccount:', memoryAccountError);
          if (memoryAccountError instanceof Error) {
            console.error('[TRACE_AE_WALLET] Error message:', memoryAccountError.message);
            console.error('[TRACE_AE_WALLET] Error stack:', memoryAccountError.stack);
          }
          throw memoryAccountError;
        }
        
        elizaLogger.info(`Account address from direct secret key: ${this.publicKey}`);
        
        // Verify the address matches what's configured
        if (this.publicKey !== configuredAddress) {
          console.error('[TRACE_AE_WALLET] Address mismatch:', {
            expected: configuredAddress,
            actual: this.publicKey
          });
          elizaLogger.error('ERROR: The address derived from AE_WALLET_SECRET_KEY does not match AE_WALLET_ADDRESS!');
          elizaLogger.error(`Expected: ${configuredAddress}, Got: ${this.publicKey}`);
          throw new Error('Secret key does not match configured wallet address');
        }
        
        // Initialize client and skip the rest of the initialization
        console.log('[TRACE_AE_WALLET] Initializing AeSdk client with direct key...');
        elizaLogger.info('Initializing AeSdk client with direct key...');
        try {
          this.client = new AeSdk({
            nodes: [{ name: 'mainnet', instance: this.node }],
            compilerUrl: compilerUrl,
            accounts: [this.account],
          });
          console.log('[TRACE_AE_WALLET] AeSdk client initialized successfully');
        } catch (aeSdkError) {
          console.error('[TRACE_AE_WALLET] ERROR initializing AeSdk:', aeSdkError);
          throw aeSdkError;
        }
        elizaLogger.info('AeternityWalletService initialized successfully with direct key.');
        return;
      }
      
      // Determine if the secret key is a mnemonic phrase, hex, or assumed base58
      console.log('[TRACE_AE_WALLET] Using mnemonic/hex path since no direct key found');
      let keyBuffer32Bytes: Buffer | undefined;

      if (rawSecretKey.split(' ').length === 12 || rawSecretKey.split(' ').length === 24) {
        console.log('[TRACE_AE_WALLET] Detected mnemonic phrase');
        elizaLogger.info('Detected mnemonic phrase for AETERNITY_SECRET_KEY.');
        
        try {
          console.log('[TRACE_AE_WALLET] Dynamically importing HD wallet module...');
          const hdWalletModule = await import('@aeternity/hd-wallet');
          console.log('[TRACE_AE_WALLET] HD wallet module imported:', {
            moduleKeys: Object.keys(hdWalletModule),
            hasDefault: !!hdWalletModule.default,
            hasGenerateHDWallet: typeof hdWalletModule.generateHDWallet === 'function',
            hasGetHDWalletAccounts: typeof hdWalletModule.getHDWalletAccounts === 'function'
          });
          elizaLogger.debug('Dynamically imported hdWalletModule (for mnemonic):', hdWalletModule);

          let generateHDWalletFunc: any;
          let getHDWalletAccountsFunc: any;

          if (hdWalletModule && typeof hdWalletModule.generateHDWallet === 'function') {
              generateHDWalletFunc = hdWalletModule.generateHDWallet;
              getHDWalletAccountsFunc = hdWalletModule.getHDWalletAccounts;
              console.log('[TRACE_AE_WALLET] Found functions directly on imported module');
              elizaLogger.info('Found functions directly on imported module.');
          } else if (hdWalletModule && hdWalletModule.default && typeof hdWalletModule.default.generateHDWallet === 'function') {
              generateHDWalletFunc = hdWalletModule.default.generateHDWallet;
              getHDWalletAccountsFunc = hdWalletModule.default.getHDWalletAccounts;
              console.log('[TRACE_AE_WALLET] Found functions on .default property');
              elizaLogger.info('Found functions on .default property of imported module.');
          } else {
              console.error('[TRACE_AE_WALLET] Failed to find HD wallet functions');
              elizaLogger.error('Failed to find generateHDWallet/getHDWalletAccounts functions via dynamic import.');
              throw new Error('Cannot resolve required functions from @aeternity/hd-wallet');
          }

          console.log('[TRACE_AE_WALLET] Function types:', {
            generateHDWalletType: typeof generateHDWalletFunc,
            getHDWalletAccountsType: typeof getHDWalletAccountsFunc
          });

          if (typeof generateHDWalletFunc !== 'function' || typeof getHDWalletAccountsFunc !== 'function') {
              console.error('[TRACE_AE_WALLET] Resolved HD Wallet functions are not valid functions');
              elizaLogger.error('Resolved HD Wallet functions are not valid functions!');
              throw new Error('Resolved generateHDWallet or getHDWalletAccounts variable is not a function');
          }

          console.log('[TRACE_AE_WALLET] Generating HD wallet from mnemonic...');
          elizaLogger.info('Attempting to generate HD wallet instance from mnemonic...');
          const hdWalletInstance = await generateHDWalletFunc(rawSecretKey);
          console.log('[TRACE_AE_WALLET] HD wallet instance generated:', !!hdWalletInstance);
          
          // Check if a specific HD wallet index is specified
          const hdIndex = env.AE_WALLET_HD_INDEX ? parseInt(env.AE_WALLET_HD_INDEX, 10) : 0;
          console.log('[TRACE_AE_WALLET] Using HD wallet index:', hdIndex);
          if (hdIndex > 0) {
            elizaLogger.info(`Using specified HD wallet index: ${hdIndex}`);
          }
          
          console.log('[TRACE_AE_WALLET] Getting accounts from HD wallet...');
          elizaLogger.info(`Getting accounts from HD wallet instance (index: ${hdIndex})...`);
          // Always get at least hdIndex + 1 accounts to include the specified index
          const numAccountsToGet = Math.max(1, hdIndex + 1);
          const accounts = await getHDWalletAccountsFunc(hdWalletInstance, numAccountsToGet);
          
          if (!accounts || !Array.isArray(accounts)) {
            console.error('[TRACE_AE_WALLET] Accounts is not an array:', accounts);
            throw new Error('HD wallet did not return an array of accounts');
          }
          
          console.log('[TRACE_AE_WALLET] Got accounts:', {
            count: accounts.length,
            firstAccount: accounts[0] ? 'exists' : 'missing'
          });

          // Log account structure for debugging
          if (accounts[0]) {
            console.log('[TRACE_AE_WALLET] First account structure:', {
              hasPublicKey: !!accounts[0].publicKey,
              hasSecretKey: !!accounts[0].secretKey,
              publicKeyType: typeof accounts[0].publicKey,
              publicKeyIsBuffer: Buffer.isBuffer(accounts[0].publicKey),
              secretKeyType: typeof accounts[0].secretKey,
              secretKeyIsBuffer: Buffer.isBuffer(accounts[0].secretKey)
            });
            
            if (accounts[0].secretKey) {
              console.log('[TRACE_AE_WALLET] Secret key exists in first account');
              if (Buffer.isBuffer(accounts[0].secretKey)) {
                console.log('[TRACE_AE_WALLET] Secret key is Buffer, length:', accounts[0].secretKey.length);
              } else if (typeof accounts[0].secretKey === 'object') {
                console.log('[TRACE_AE_WALLET] Secret key is object with keys:', Object.keys(accounts[0].secretKey));
              }
            }
          }
          
          elizaLogger.debug('First account structure:', JSON.stringify(accounts[0], null, 2));
          
          if (!accounts || !Array.isArray(accounts) || accounts.length === 0 || !accounts[0] || !accounts[0].secretKey) {
            elizaLogger.error('getHDWalletAccounts did not return a valid account structure or secretKey.', { accounts });
            throw new Error('Failed to derive account structure from mnemonic using getHDWalletAccounts.');
          }

          // If we have a specific HD index, use that account
          let selectedAccount = accounts[0]; // Default to first account
          
          if (hdIndex > 0 && accounts.length > hdIndex) {
            elizaLogger.info(`Using account at specified HD index ${hdIndex}`);
            selectedAccount = accounts[hdIndex];
            elizaLogger.info(`Selected HD wallet public key: ${selectedAccount.publicKey}`);
          } else if (hdIndex > 0) {
            elizaLogger.error(`Requested HD index ${hdIndex} is out of range. Only have ${accounts.length} accounts.`);
            throw new Error(`HD wallet index ${hdIndex} exceeds available accounts (${accounts.length})`);
          }

          // Check if a specific wallet address is requested
          const configuredWalletAddress = env.AE_WALLET_ADDRESS?.trim();
          if (configuredWalletAddress) {
            elizaLogger.info(`Configured wallet address in AE_WALLET_ADDRESS: ${configuredWalletAddress}`);
            
            // If multiple accounts are needed to match the configured address
            const numAccountsToCheck = 10; // Check up to 10 derived wallets
            if (accounts.length === 1) {
              elizaLogger.info(`Checking ${numAccountsToCheck} derived wallets for a match with configured address...`);
              const moreAccounts = await getHDWalletAccountsFunc(hdWalletInstance, numAccountsToCheck);
              
              // Check if the configured address matches any of the derived wallets
              const matchingAccount = moreAccounts.find((acc: any) => {
                // Format the derived address using our helper function
                const derivedAddress = formatHdWalletPubKey(acc.publicKey);
                
                elizaLogger.debug(`Comparing derived address: ${derivedAddress} with configured: ${configuredWalletAddress}`);
                return derivedAddress === configuredWalletAddress;
              });
              
              if (matchingAccount) {
                elizaLogger.info(`Found matching account at index ${moreAccounts.indexOf(matchingAccount)}`);
                selectedAccount = matchingAccount; // Use the matching account
              } else {
                elizaLogger.warn(`WARNING: Configured wallet address ${configuredWalletAddress} does not match any of the first ${numAccountsToCheck} derived wallets. Using first derived wallet instead.`);
                
                // Format addresses properly for display using the helper function
                const formattedAddresses = moreAccounts.map((a: any, index: number) => {
                  return `${index}: ${formatHdWalletPubKey(a.publicKey)}`;
                }).join('\n');
                
                elizaLogger.warn(`First ${numAccountsToCheck} derived addresses:\n${formattedAddresses}`);
                elizaLogger.warn('This may cause tipping to fail if the derived wallet has no funds!');
              }
            }
          }

          let accountSecretKeyObject = selectedAccount.secretKey;
          let derivedMnemonicBuffer: Buffer;

          if (Buffer.isBuffer(accountSecretKeyObject)) {
            elizaLogger.info('secretKey from hd-wallet is already a Buffer instance.');
            derivedMnemonicBuffer = accountSecretKeyObject;
          } else if (typeof accountSecretKeyObject === 'object' && accountSecretKeyObject !== null) {
            elizaLogger.info('secretKey from hd-wallet is an object, attempting to reconstruct as Buffer.');
            try {
              const byteArray = Object.values(accountSecretKeyObject as Record<string, number>);
              derivedMnemonicBuffer = Buffer.from(byteArray);
              elizaLogger.info('Successfully reconstructed Buffer from object.');
            } catch (conversionError) {
              elizaLogger.error('Failed to convert secretKey object to Buffer.', { accountSecretKeyObject, conversionError });
              throw new Error('Could not convert secretKey from hd-wallet to a Buffer.');
            }
          } else {
            elizaLogger.error('secretKey from hd-wallet is not a Buffer and not a convertible object.', { secretKey: accountSecretKeyObject });
            throw new Error('Unexpected type for secretKey from hd-wallet.');
          }
          
          if (!Buffer.isBuffer(derivedMnemonicBuffer) || (derivedMnemonicBuffer.length !== 32 && derivedMnemonicBuffer.length !== 64)) { 
            elizaLogger.error('Derived secretKey is not a valid 32 or 64 byte Buffer after processing (mnemonic).', { buffer: derivedMnemonicBuffer });
            throw new Error('Failed to obtain a valid 32 or 64 byte secretKey Buffer from mnemonic.');
          }
          elizaLogger.info(`Initial derivedMnemonicBuffer length: ${derivedMnemonicBuffer.length}`);
          
          if (derivedMnemonicBuffer.length === 64) {
            keyBuffer32Bytes = derivedMnemonicBuffer.slice(0, 32);
            elizaLogger.info(`Sliced to 32 bytes for keyBuffer32Bytes. Length: ${keyBuffer32Bytes.length}`);
          } else { // It must be 32 if not 64 (due to check above)
            keyBuffer32Bytes = derivedMnemonicBuffer;
            elizaLogger.info('Using 32-byte derivedMnemonicBuffer directly for keyBuffer32Bytes.');
          }

        } catch (error) {
          elizaLogger.error('Error during HD wallet initialization:', { error });
          throw error;
        }

      } else if (/^[0-9a-fA-F]+$/.test(rawSecretKey) && (rawSecretKey.length === 128 || rawSecretKey.length === 64)) {
        elizaLogger.info('Detected hex format for AETERNITY_SECRET_KEY.');
        let rawHexKeyForBuffer: string;
        if (rawSecretKey.length === 128) { // 64 byte hex string
          elizaLogger.info('Hex key is 64 bytes (128 chars). Taking first 32 bytes (64 chars of hex).');
          rawHexKeyForBuffer = rawSecretKey.slice(0, 64);
        } else { // 32 byte hex string (64 chars)
          elizaLogger.info('Hex key is 32 bytes (64 chars). Using directly.');
          rawHexKeyForBuffer = rawSecretKey;
        }
        keyBuffer32Bytes = Buffer.from(rawHexKeyForBuffer, 'hex');
        if (keyBuffer32Bytes.length !== 32) {
          elizaLogger.error('Hex derived keyBuffer32Bytes is not 32 bytes long.', { length: keyBuffer32Bytes.length });
          throw new Error('Failed to derive 32-byte key from hex.');
        }
      
      } else if (rawSecretKey.startsWith('sk_')) {
        elizaLogger.info('Detected pre-formatted sk_ key in environment. Will use directly.');
        finalKeyMaterialForMemoryAccount = rawSecretKey; // Assigned here
      } else {
        elizaLogger.error('AETERNITY_SECRET_KEY format is not a mnemonic, a valid hex (32/64 bytes), or sk_ prefixed.', { rawSecretKey });
        throw new Error('Invalid AETERNITY_SECRET_KEY format.');
      }
      
      // If keyBuffer32Bytes was derived (from mnemonic or hex), encode it now.
      if (keyBuffer32Bytes) {
        if (!Buffer.isBuffer(keyBuffer32Bytes) || keyBuffer32Bytes.length !== 32) { // Should be guaranteed 32 bytes by logic above
          elizaLogger.error('Internal error: keyBuffer32Bytes is not a 32-byte Buffer before encoding.', { keyBuffer32Bytes });
          throw new Error('Cannot encode non-32-byte buffer to sk_ format.');
        }
        elizaLogger.info(`Raw 32-byte Buffer derived. Encoding to sk_... format. Length: ${keyBuffer32Bytes.length}`);
        // const tag = Buffer.from([0x1d]); // Prefix byte for sk_ encoding - REMOVED based on PayloadLengthError
        // const payload = Buffer.concat([tag, keyBuffer32Bytes]); // REMOVED
        // Encode the 32-byte key directly
        const base58Encoded = base58check.encode(keyBuffer32Bytes);
        finalKeyMaterialForMemoryAccount = `sk_${base58Encoded}`; // Assigned here
      }
      
      // After all processing, finalKeyMaterialForMemoryAccount must be an sk_ string.
      if (typeof finalKeyMaterialForMemoryAccount !== 'string' || !finalKeyMaterialForMemoryAccount.startsWith('sk_')) {
        elizaLogger.error('FATAL: Key material for MemoryAccount did not resolve to an sk_ prefixed string!', { keyMaterial: finalKeyMaterialForMemoryAccount });
        throw new Error('Key material for MemoryAccount must be an sk_ prefixed string after processing.');
      }

      elizaLogger.info(`Initializing MemoryAccount with sk_ key material. Type: ${typeof finalKeyMaterialForMemoryAccount}`);
      elizaLogger.info(`Key material successfully prepared (private key format: sk_****)`);
      
      // Pass the sk_ encoded string directly, as per latest expert advice for SDK v14
      this.account = new MemoryAccount(finalKeyMaterialForMemoryAccount as any);
      
      this.publicKey = this.account.address; 
      elizaLogger.info(`Account address (public key): ${this.publicKey}`);

      elizaLogger.info('Initializing AeSdk client...');
      this.client = new AeSdk({
        nodes: [{ name: 'mainnet', instance: this.node }], // TODO: Make 'mainnet' node name configurable
        compilerUrl: compilerUrl,
        accounts: [this.account],
      });
      elizaLogger.info('AeternityWalletService initialized successfully with AeSdk client.');

    } catch (error) {
      elizaLogger.error('Error during AeternityWalletService initialization:', { error });
      throw error; // Re-throw the error to ensure it's caught by the plugin loader
    }
  }

  /**
   * Securely retrieves the private key.
   * Access is restricted based on security level.
   *
   * @returns The private key string if security level allows.
   * @throws Error if access is denied due to security level or key not exportable.
   */
  async getPrivateKey(): Promise<string> {
    if (this.securityLevel < WalletSecurityLevel.HIGH) {
      throw new Error('Access denied: High security level required to export private key.');
    }
    if (!this.account) {
      throw new Error('Wallet not initialized.');
    }
    // MemoryAccount does not directly expose the secretKey after initialization.
    // We derived base58SecretKey earlier, but didn't store it long-term.
    // Re-deriving from the original env var might be needed if export is essential,
    // OR we could store base58SecretKey in the class if needed.
    // For now, throw, as direct export is complex and potentially insecure.
    throw new Error('Private key export not directly supported by this service after initialization.');
  }

  /**
   * Gets the public address (ak_...) of the initialized wallet.
   * @returns The public address string.
   * @throws Error if the wallet is not initialized.
   */
  async getAddress(): Promise<string> {
    if (!this.account) {
      throw new Error('Aeternity account not initialized.');
    }
    return this.publicKey; // Return the stored public key
  }

  /**
   * Gets the balance of the specified address or the initialized wallet's address.
   * @param address - Optional target address (ak_...). Defaults to the service's address.
   * @returns The balance in AE (as a string).
   * @throws Error if the client is not initialized or address is unavailable.
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Aeternity client not initialized.');
    }
    const targetAddress = address || this.publicKey;
    if (!targetAddress) {
        throw new Error('No address provided and public key not available.');
    }
    const balance = await this.client.getBalance(targetAddress);
    return new BigNumber(balance).shiftedBy(-18).toString(); // Format to AE
  }

  /**
   * Logs the current wallet address and balance to the console.
   */
  async logBalance(): Promise<void> {
    try {
      const address = await this.getAddress();
      const balance = await this.getBalance(address);
      elizaLogger.info(`Aeternity wallet address: ${address}`);
      elizaLogger.info(`Aeternity wallet balance: ${balance} AE`);
    } catch (error) {
      elizaLogger.error('Error logging Aeternity balance:', { error });
    }
  }

  /**
   * Sends AE tokens to a recipient address.
   * @param recipientAddress - The 'ak_' address of the recipient.
   * @param amount - The amount of AE tokens to send (as a string, e.g., '1.5').
   * @param payload - Optional payload string to attach.
   * @returns The transaction hash if successful.
   * @throws Error if the transaction fails.
   */
  public async sendTransaction(
    recipientAddress: string,
    amount: string,
    payload?: string
  ): Promise<string> {
    if (!this.client || !this.publicKey) {
      elizaLogger.error('Wallet service not initialized when attempting to send transaction');
      throw new Error('Wallet service not initialized.');
    }

    if (!recipientAddress) {
      elizaLogger.error('Recipient address is missing');
      throw new Error('Recipient address is required for transaction');
    }

    if (!recipientAddress.startsWith('ak_')) {
      elizaLogger.error(`Invalid recipient address format: ${recipientAddress}`);
      throw new Error('Recipient address must start with "ak_"');
    }

    if (!amount) {
      elizaLogger.error('Amount is missing');
      throw new Error('Amount is required for transaction');
    }

    try {
      // Verify we have sufficient balance
      const currentBalance = await this.getBalance();
      elizaLogger.info(`Current wallet balance: ${currentBalance} AE`);
      
      // Convert amount to BigNumber for precision
      const amountBigNum = new BigNumber(amount);
      
      // Validate amount is positive
      if (amountBigNum.isNaN() || amountBigNum.isLessThanOrEqualTo(0)) {
        elizaLogger.error(`Invalid amount: ${amount}`);
        throw new Error('Amount must be a positive number');
      }
      
      // Check if we have enough balance
      if (new BigNumber(currentBalance).isLessThan(amountBigNum)) {
        elizaLogger.error(`Insufficient funds: balance=${currentBalance}, amount=${amount}`);
        throw new Error(`Insufficient funds: wallet has ${currentBalance} AE, trying to send ${amount} AE`);
      }

      elizaLogger.info(`Sending ${amount} AE to ${recipientAddress}...`);
      
      const spendTx = await this.client.spend(
        amountBigNum.toString(), // Ensure amount is string
        recipientAddress,
        {
          payload: payload ? Buffer.from(payload) : undefined,
        },
      );

      elizaLogger.info(
        `Transaction sent successfully! Hash=${spendTx.hash}, Amount=${amount}, Recipient=${recipientAddress}`,
      );
      return spendTx.hash;
    } catch (error: any) {
      elizaLogger.error('Error sending transaction:', {
        message: error.message,
        stack: error.stack,
        recipientAddress,
        amount,
        error,
      });
      
      // Provide a more descriptive error based on the type
      if (error.message?.includes('Insufficient funds')) {
        throw new Error(`Insufficient funds to complete the transaction: ${error.message}`);
      } else if (error.message?.includes('invalid address')) {
        throw new Error(`Invalid recipient address format: ${error.message}`);
      } else if (error.message?.includes('network')) {
        throw new Error(`Network error while sending transaction: ${error.message}`);
      } else {
      throw new Error(`Failed to send transaction: ${error.message}`);
      }
    }
  }

  public getClient(): AeSdk {
    if (!this.client) throw new Error('Wallet not initialized');
    return this.client;
  }

  /**
   * Shuts down the service (currently a no-op).
   */
  async shutdown(): Promise<void> {
    elizaLogger.info('Shutting down Aeternity Wallet Service...');
    // No explicit shutdown needed for AeSdk client itself unless connections need closing
  }
}

/**
 * Helper function to convert a HD wallet account publicKey to ak_ format
 * @param pubKey The publicKey from HD wallet account
 * @returns The ak_ formatted address
 */
const formatHdWalletPubKey = (pubKey: any): string => {
    if (typeof pubKey === 'string') {
        // If it already starts with ak_, return as is
        if (pubKey.startsWith('ak_')) return pubKey;
        // Otherwise encode with base58check
        return `ak_${base58check.encode(Buffer.from(pubKey, 'hex'))}`;
    }
    
    if (Buffer.isBuffer(pubKey)) {
        return `ak_${base58check.encode(pubKey)}`;
    }
    
    // For object-like pubKeys, try to convert to buffer first
    if (pubKey && typeof pubKey === 'object') {
        try {
            const byteArray = Object.values(pubKey as Record<string, number>);
            const buffer = Buffer.from(byteArray);
            return `ak_${base58check.encode(buffer)}`;
        } catch (e) {
            // Fall back to string representation
            return `ak_unknown_${String(pubKey).slice(0, 10)}`;
        }
    }
    
    return `ak_unknown_${String(pubKey).slice(0, 10)}`;
};