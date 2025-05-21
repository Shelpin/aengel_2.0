#!/usr/bin/env node
/**
 * Test Aeternity Wallet Functionality
 * 
 * This script tests the Aeternity wallet functionality in isolation,
 * focusing on HD wallet derivation and MemoryAccount initialization.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  fg: {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color;
  let prefix;
  
  switch(type) {
    case 'success':
      color = colors.fg.green;
      prefix = '✓ SUCCESS';
      break;
    case 'error':
      color = colors.fg.red;
      prefix = '✗ ERROR';
      break;
    case 'warning':
      color = colors.fg.yellow;
      prefix = '⚠ WARNING';
      break;
    case 'debug':
      color = colors.fg.gray;
      prefix = '· DEBUG';
      break;
    default:
      color = colors.fg.blue;
      prefix = 'ℹ INFO';
  }
  
  console.log(`${color}[${timestamp}] ${prefix}:${colors.reset} ${message}`);
}

async function testWallet() {
  console.log("\n========== AETERNITY WALLET TEST ==========\n");
  
  // 1. Verify environment variables
  log("Checking environment variables...");
  const requiredEnvVars = [
    'AETERNITY_NODE_URL',
    'AETERNITY_COMPILER_URL',
    'AETERNITY_SECRET_KEY'
  ];
  
  let missingVars = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
    return false;
  }
  
  log("Environment variables verified", 'success');
  
  // 2. Import Aeternity SDK
  log("Importing Aeternity SDK...");
  let AeSdk, Node, MemoryAccount;
  
  try {
    const aeSDK = await import('@aeternity/aepp-sdk');
    ({ AeSdk, Node, MemoryAccount } = aeSDK);
    log("Successfully imported Aeternity SDK", 'success');
  } catch (error) {
    log(`Failed to import Aeternity SDK: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
  
  // 3. Import HD Wallet (if we have a mnemonic)
  let hdWallet = null;
  const mnemonic = process.env.AETERNITY_SECRET_KEY;
  
  if (mnemonic && mnemonic.includes(' ')) {
    log("Detected mnemonic format, importing HD wallet library...");
    try {
      const { generateHDWallet, getHDWalletAccounts } = await import('@aeternity/hd-wallet');
      log("Successfully imported HD wallet library", 'success');
      
      // Generate HD wallet
      log("Generating HD wallet from mnemonic...");
      hdWallet = await generateHDWallet(mnemonic);
      log("HD wallet successfully generated", 'success');
      
      // Derive accounts
      const hdIndex = parseInt(process.env.AE_WALLET_HD_INDEX || '0', 10);
      log(`Deriving account at index ${hdIndex}...`);
      const accounts = await getHDWalletAccounts(hdWallet, 1, hdIndex);
      
      if (accounts && accounts.length > 0) {
        const { publicKey, secretKey } = accounts[0];
        log(`Successfully derived account:`, 'success');
        log(`  Public Key: ${publicKey}`, 'debug');
        log(`  Secret Key Type: ${typeof secretKey}`, 'debug');
        
        // Test creating memory account
        log("Creating MemoryAccount from HD wallet...");
        try {
          const account = new MemoryAccount({ keypair: { secretKey, publicKey } });
          log(`Memory account created successfully: ${account.address}`, 'success');
          
          // Verify address matches expected
          if (process.env.AE_WALLET_ADDRESS && account.address !== process.env.AE_WALLET_ADDRESS) {
            log(`Warning: Derived address ${account.address} doesn't match environment variable ${process.env.AE_WALLET_ADDRESS}`, 'warning');
          }
        } catch (error) {
          log(`Failed to create MemoryAccount: ${error.message}`, 'error');
          console.error(error);
        }
      } else {
        log("No accounts derived from HD wallet", 'error');
      }
    } catch (error) {
      log(`HD wallet error: ${error.message}`, 'error');
      console.error(error);
    }
  } else {
    log("Not using mnemonic format - skipping HD wallet tests", 'info');
    
    // Test direct MemoryAccount creation if we have a secret key in another format
    if (process.env.AE_WALLET_SECRET_KEY) {
      log("Testing direct MemoryAccount creation with AE_WALLET_SECRET_KEY...");
      try {
        const account = new MemoryAccount(process.env.AE_WALLET_SECRET_KEY);
        log(`Memory account created successfully: ${account.address}`, 'success');
      } catch (error) {
        log(`Failed to create MemoryAccount: ${error.message}`, 'error');
        console.error(error);
      }
    }
  }
  
  // 4. Test Node connection
  log("Testing Node connection...");
  try {
    const node = new Node(process.env.AETERNITY_NODE_URL);
    const nodeInfo = await node.getNodeInfo();
    log(`Successfully connected to node: ${nodeInfo.version}`, 'success');
  } catch (error) {
    log(`Failed to connect to node: ${error.message}`, 'error');
    console.error(error);
  }
  
  return true;
}

testWallet().then((success) => {
  console.log("\n========== TEST COMPLETE ==========\n");
  if (success) {
    log("All imports and critical functionality tested", 'success');
  } else {
    log("Test completed with errors", 'error');
  }
}); 