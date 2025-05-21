/**
 * Aeternity Wallet Balance Checker
 * 
 * This script verifies your wallet balance before production deployment.
 * It tests connectivity to the Aeternity node and checks if funds are available.
 */

const dotenv = require('dotenv');
const { AeSdk, Node } = require('@aeternity/aepp-sdk');
const CryptoJS = require('crypto-js');

// Load environment variables
dotenv.config();

// Define required environment variables
const requiredEnvVars = [
  'AE_WALLET_ADDRESS',
  'WALLET_SECRET_KEY',
  'WALLET_SECRET_SALT',
  'AETERNITY_NODE_URL',
  'AETERNITY_NETWORK_ID'
];

// Minimum balance for production in AE units (0.1 AE)
const MIN_BALANCE_AE = 0.1;
// Convert to smallest units (aettos)
const MIN_BALANCE_AETTOS = MIN_BALANCE_AE * 1000000000000000000;

/**
 * Main function to check balance and validate configuration
 */
async function checkBalanceAndConfig() {
  console.log('\n🔍 Aeternity Wallet Balance & Configuration Check');
  console.log('======================================================');
  
  // Check for required environment variables
  let missingVars = [];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease add these to your .env file before proceeding.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present');
  
  // Get wallet address
  const walletAddress = process.env.AE_WALLET_ADDRESS;
  console.log(`\n👛 Wallet Address: ${walletAddress}`);
  console.log(`🌐 Network: ${process.env.AETERNITY_NETWORK_ID}`);
  console.log(`🔗 Node URL: ${process.env.AETERNITY_NODE_URL}`);
  
  try {
    // Connect to node
    console.log('\n🔄 Connecting to Aeternity network...');
    
    const node = new Node(process.env.AETERNITY_NODE_URL);
    const aeSdk = new AeSdk({
      nodes: [{name: 'node', instance: node}],
      networkId: process.env.AETERNITY_NETWORK_ID
    });
    
    console.log('✅ Connected to node successfully');
    
    // Check account balance
    console.log('\n🔄 Checking wallet balance...');
    
    try {
      const balance = await aeSdk.getBalance(walletAddress);
      const balanceAE = balance / 1000000000000000000; // Convert from aettos to AE
      
      console.log(`💰 Balance: ${balanceAE.toFixed(4)} AE (${balance} aettos)`);
      
      if (parseInt(balance) < MIN_BALANCE_AETTOS) {
        console.warn(`⚠️  WARNING: Balance is below recommended minimum of ${MIN_BALANCE_AE} AE for production use`);
        console.warn('   Consider adding more funds before deploying to production');
      } else {
        console.log('✅ Balance is sufficient for production use');
      }
      
      // Try to decrypt private key
      try {
        console.log('\n🔄 Verifying wallet key decryption...');
        const encryptedKey = process.env.WALLET_SECRET_KEY;
        const salt = process.env.WALLET_SECRET_SALT;
        
        const bytes = CryptoJS.AES.decrypt(encryptedKey, salt);
        const privateKey = bytes.toString(CryptoJS.enc.Utf8);
        
        if (privateKey && privateKey.startsWith('sk_')) {
          console.log('✅ Private key decryption successful');
        } else {
          console.error('❌ Private key decryption failed or key format is incorrect');
          console.error('   The decrypted key should start with "sk_"');
        }
      } catch (decryptError) {
        console.error('❌ Failed to decrypt private key:', decryptError.message);
      }
      
    } catch (balanceError) {
      console.error('❌ Failed to check balance:', balanceError.message);
    }
    
  } catch (nodeError) {
    console.error('❌ Failed to connect to Aeternity node:', nodeError.message);
    console.error('   Please check your AETERNITY_NODE_URL configuration');
  }
  
  // Provide summary
  console.log('\n📋 Pre-production Checklist:');
  console.log('======================================================');
  console.log('1. ✅ Environment variables configured');
  console.log(`2. ${parseInt(balance) >= MIN_BALANCE_AETTOS ? '✅' : '❌'} Sufficient wallet balance`);
  console.log(`3. ${privateKey && privateKey.startsWith('sk_') ? '✅' : '❌'} Private key decryption`);
  console.log('4. ❓ Telegram Bot configuration (check manually)');
  console.log('5. ❓ ElizaOS runtime integration (check manually)');
  
  console.log('\n======================================================');
  console.log('🔍 Balance check completed');
}

// Run the script
checkBalanceAndConfig().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 