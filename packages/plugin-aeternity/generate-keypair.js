/**
 * This script generates a new Aeternity keypair that can be used for testing
 * It prints both the private key and the public address
 */

// Import the SDK
const { AeSdk, MemoryAccount } = require('@aeternity/aepp-sdk');
const CryptoJS = require('crypto-js');

// Generate a random salt for testing
const generateRandomSalt = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate a new key pair
const generateNewKeyPair = async () => {
  try {
    // Generate a new account
    const account = MemoryAccount.generate();
    console.log('\n🔑 Generated New Aeternity Keypair:');
    console.log('-'.repeat(50));
    
    console.log(`Public Address: ${account.address}`);
    
    // Generate a test salt
    const salt = generateRandomSalt();
    
    // Encrypt the private key (as would be done in the plugin)
    const encryptedKey = CryptoJS.AES.encrypt(account.secretKey, salt).toString();
    
    console.log('\n✅ Add these to your .env file:');
    console.log('-'.repeat(50));
    console.log(`WALLET_SECRET_KEY=${encryptedKey}`);
    console.log(`WALLET_SECRET_SALT=${salt}`);
    console.log(`AE_WALLET_ADDRESS=${account.address}`);
    
    console.log('\n🔒 Keep your original private key secure (do not share):');
    console.log('-'.repeat(50));
    console.log(`Original Private Key: ${account.secretKey}`);
    
    console.log('\n💰 Get testnet tokens:');
    console.log('-'.repeat(50));
    console.log(`Visit: https://faucet.aepps.com/ and enter your address: ${account.address}`);
  } catch (error) {
    console.error('Error generating keypair:', error);
  }
};

// Run the function
generateNewKeyPair(); 