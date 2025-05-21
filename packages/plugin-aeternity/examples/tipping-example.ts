import { initializeRuntime } from 'elizaos'; // You would import from elizaos in a real project
import { aeternityPlugin } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Initializing Aeternity Plugin...');
  
  // Initialize ElizaOS runtime with the Aeternity plugin
  const runtime = await initializeRuntime({
    plugins: [aeternityPlugin],
  });
  
  // Access the wallet provider to get address and balance
  console.log('Checking wallet information...');
  const walletProvider = await runtime.getProvider('aeternityWallet');
  
  try {
    const address = await walletProvider.getAddress();
    console.log(`Wallet Address: ${address}`);
    
    const balance = await walletProvider.getBalance();
    console.log(`Wallet Balance: ${balance} AE`);
    
    // Example 1: Send a direct AE transfer
    console.log('\nExample 1: Sending direct AE transfer...');
    const transferResult = await runtime.executeAction('TRANSFER_AE', {
      recipient: 'ak_recipientAddressHere', // Replace with actual address
      amount: '0.01', // Small amount for testing
    });
    
    console.log('Transfer Result:', transferResult);
    
    // Example 2: Tip a Telegram user (using direct address for now)
    console.log('\nExample 2: Tipping a Telegram user...');
    const tipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: 'ak_recipientAddressHere', // Replace with actual address
      amount: '0.01', // Small amount for testing
      message: 'Thanks for your helpful contribution!',
    });
    
    console.log('Tip Result:', tipResult);
    
    // Future examples will include:
    // - Token deployment
    // - Token transfers
    // - DEX operations
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 