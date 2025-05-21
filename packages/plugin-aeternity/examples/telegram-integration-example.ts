import { initializeRuntime } from 'elizaos'; // Import from elizaos in a real project
import { aeternityPlugin } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Example implementation of a simplified Telegram client
class SimpleTelegramClient {
  // This would be implemented using a real Telegram API client in production
  async sendDirectMessage(username: string, message: string): Promise<boolean> {
    console.log(`\n[TELEGRAM DM] TO @${username}:`);
    console.log(message);
    console.log('-'.repeat(50));
    return true;
  }
  
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    console.log(`\n[TELEGRAM GROUP] TO ${chatId}:`);
    console.log(message);
    console.log('-'.repeat(50));
    return true;
  }
}

// Simulate a Telegram message from a user
function simulateTelegramMessage(from: string, text: string, isDirect = true) {
  return {
    from: { username: from },
    text,
    is_direct: isDirect,
    chat_id: `chat_with_${from}`,
    message_id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
}

async function demonstrateTippingWorkflow() {
  console.log('=== Aeternity Telegram Tipping Workflow ===\n');
  
  // Initialize ElizaOS runtime with the Aeternity plugin
  console.log('1. Initializing Aeternity Plugin...');
  const telegramClient = new SimpleTelegramClient();
  
  const runtime = await initializeRuntime({
    plugins: [aeternityPlugin],
  });
  
  // Provide the Telegram client to the runtime context
  runtime.telegramClient = telegramClient;
  
  // Example group chat ID
  const groupChatId = "aeternity_community_chat";
  
  try {
    // Step 1: Try to tip a user who hasn't registered an address yet
    console.log('\n2. Tipping a user who has not registered an address yet...');
    const tipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: '@helpful_user',
      amount: '0.5',
      message: 'Thanks for your helpful explanation in the channel!',
      chatId: groupChatId // Include the group chat ID for notifications
    });
    
    console.log('Tip Result:', tipResult);
    
    // Step 2: Simulate the user replying with their address
    console.log('\n3. Simulating user reply with Aeternity address...');
    
    // Create a simulated message
    const userReply = simulateTelegramMessage('helpful_user', 'ak_2KAcA2Pp1nrR8Wkt3FtCkReGzAi8vJ9Snxa4PcmrthVx8AhPe');
    
    // Process the message using the plugin's handler (add chatId to context)
    const handlerContext = { 
      ...runtime, 
      additionalData: { 
        chatId: groupChatId 
      }
    };
    
    // Process the address registration with the group chat ID
    await runtime.executeAction('PROCESS_ADDRESS_REGISTRATION', {
      username: userReply.from.username,
      address: userReply.text,
      chatId: groupChatId
    });
    
    // Step 3: Demonstrate tipping the same user again (should now use stored address)
    console.log('\n4. Tipping the same user again (now with stored address)...');
    const secondTipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: '@helpful_user',
      amount: '0.25',
      message: 'Another tip for your continued contributions!',
      chatId: groupChatId // Include the group chat ID for notifications
    });
    
    console.log('Second Tip Result:', secondTipResult);
    
    // Step 4: Demonstrate tipping with direct AE address
    console.log('\n5. Tipping directly to an AE address...');
    const directTipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: 'ak_2KAcA2Pp1nrR8Wkt3FtCkReGzAi8vJ9Snxa4PcmrthVx8AhPe',
      amount: '0.1',
      message: 'Direct address tip',
      chatId: groupChatId // Include the group chat ID for notifications
    });
    
    console.log('Direct Tip Result:', directTipResult);
    
    // Accessing the user address mapping
    console.log('\n6. Current user-address mappings in the system:');
    const userAddressService = await runtime.getProvider('aeternityUserAddress');
    console.log(userAddressService.exportState());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demonstration
demonstrateTippingWorkflow().catch(console.error); 