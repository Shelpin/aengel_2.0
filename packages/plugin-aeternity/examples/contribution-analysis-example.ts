/**
 * IMPORTANT: This is a demonstration example that shows how to use the contributions analyzer.
 * It is not meant to be run directly, as it requires the ElizaOS environment.
 * See README.md in this directory for more information.
 * 
 * NOTE: The linter errors about 'elizaos' module and ContributionAnalyzerService constructor 
 * parameters are expected and can be ignored. These would only be resolved in a real ElizaOS 
 * environment where the runtime is available.
 */

// Note: In a real implementation, elizaos would be imported from the actual ElizaOS package
// This is a placeholder for demonstration purposes only
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

/**
 * This function demonstrates how the ContributionAnalyzerService would be used
 * in a real ElizaOS environment. It requires the ElizaOS runtime and won't
 * work when run directly.
 */
async function demonstrateContributionAnalysis() {
  console.log('=== Aeternity Contribution Analysis and Tipping Demo ===\n');
  
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
    // Example 1: Analyze contribution with explicit description
    console.log('\n2. Analyzing a minor contribution...');
    const minorAnalysis = await runtime.executeAction('ANALYZE_CONTRIBUTION', {
      description: 'Thanks for answering my question about wallets!',
      contributor: 'new_user'
    });
    
    console.log('Analysis Result:', minorAnalysis);
    
    // Example 2: Analyze a more valuable contribution
    console.log('\n3. Analyzing a valuable contribution...');
    const valuableAnalysis = await runtime.executeAction('ANALYZE_CONTRIBUTION', {
      description: 'This detailed explanation about smart contract security was very helpful and saved me hours of debugging. The code examples were excellent!',
      contributor: 'expert_user',
      type: 'TECHNICAL_EXPLANATION'
    });
    
    console.log('Analysis Result:', valuableAnalysis);
    
    // Example 3: Analyze an exceptional contribution
    console.log('\n4. Analyzing an exceptional contribution...');
    const exceptionalAnalysis = await runtime.executeAction('ANALYZE_CONTRIBUTION', {
      description: 'Your comprehensive tutorial on Aeternity development was a game changer for our team. The step-by-step guide with working examples has revolutionized how we approach blockchain development.',
      contributor: 'blockchain_guru',
      type: 'TUTORIAL'
    });
    
    console.log('Analysis Result:', exceptionalAnalysis);
    
    // Example 4: Tip a user with automatic amount calculation
    console.log('\n5. Tipping a user with automatic amount calculation...');
    
    // First register an address for the user to avoid pending tips in this example
    await runtime.executeAction('PROCESS_ADDRESS_REGISTRATION', {
      username: 'expert_user',
      address: 'ak_2KAcA2Pp1nrR8Wkt3FtCkReGzAi8vJ9Snxa4PcmrthVx8AhPe',
      chatId: groupChatId
    });
    
    // Now tip with contribution description instead of explicit amount
    const tipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: '@expert_user',
      contributionDescription: "Great explanation of how Aeternity's state channels work. The examples were very clear and helped me understand the concept completely.",
      message: 'Thank you for your detailed explanation!',
      chatId: groupChatId
    });
    
    console.log('Tip Result:', tipResult);
    
    // Example 5: Tip with both description and explicit amount (amount should override)
    console.log('\n6. Tipping with explicit amount override...');
    const overrideTipResult = await runtime.executeAction('TIP_TELEGRAM_USER', {
      recipient: '@expert_user',
      amount: '3.0', // Override the analyzed amount
      contributionDescription: 'Thanks for the help with a simple question',
      message: 'Explicit amount overrides the analyzed amount',
      chatId: groupChatId
    });
    
    console.log('Override Tip Result:', overrideTipResult);
    
    // Example 6: Customize contribution analyzer tip amounts
    console.log('\n7. Customizing the contribution analyzer tip amounts...');
    const contributionAnalyzer = await runtime.getProvider('contributionAnalyzer');
    
    // Set custom tip amounts
    contributionAnalyzer.setTipAmounts({
      minor: '0.2',      // Increase minor tips
      valuable: '2.0',   // Double valuable tips
      exceptional: '10.0' // Double exceptional tips
    });
    
    // Analyze with new amounts
    const customAnalysis = await runtime.executeAction('ANALYZE_CONTRIBUTION', {
      description: 'This detailed explanation about smart contract security was very helpful and saved me hours of debugging. The code examples were excellent!',
      contributor: 'expert_user',
    });
    
    console.log('Custom Analysis Result:', customAnalysis);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// This function is not called directly as it requires the ElizaOS environment
// demonstrateContributionAnalysis().catch(console.error); 