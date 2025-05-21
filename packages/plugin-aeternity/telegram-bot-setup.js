/**
 * Telegram Bot Setup for Aeternity Plugin
 * 
 * This script helps you set up a Telegram bot to work with the Aeternity plugin.
 * It validates your Telegram bot token and sets up webhook configuration.
 */

const dotenv = require('dotenv');
const axios = require('axios');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Test the Telegram bot token by making an API call
 * @param {string} token - Telegram bot token
 */
async function testBotToken(token) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    return response.data.result;
  } catch (error) {
    console.error('Error testing bot token:', error.message);
    return null;
  }
}

/**
 * Set up webhook for the Telegram bot
 * @param {string} token - Telegram bot token
 * @param {string} webhookUrl - URL for the webhook
 */
async function setWebhook(token, webhookUrl) {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    return response.data;
  } catch (error) {
    console.error('Error setting webhook:', error.message);
    return null;
  }
}

/**
 * Main function to run the setup process
 */
async function setup() {
  console.log('\n🤖 Aeternity Telegram Bot Setup');
  console.log('======================================================');
  
  // Check if token is already set in environment
  let token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    token = await prompt('\n📝 Enter your Telegram bot token (from BotFather): ');
  } else {
    console.log('📝 Using Telegram bot token from .env file');
  }
  
  // Test the token
  console.log('\n🔄 Testing Telegram bot token...');
  const botInfo = await testBotToken(token);
  
  if (!botInfo) {
    console.error('❌ Invalid Telegram bot token');
    const retry = await prompt('Do you want to enter a different token? (y/n): ');
    
    if (retry.toLowerCase() === 'y') {
      token = await prompt('Enter your Telegram bot token: ');
      const botInfo = await testBotToken(token);
      
      if (!botInfo) {
        console.error('❌ Invalid Telegram bot token. Exiting setup.');
        rl.close();
        return;
      }
    } else {
      console.log('❌ Setup aborted. Please obtain a valid token from BotFather.');
      rl.close();
      return;
    }
  }
  
  console.log(`✅ Bot token is valid! Connected to @${botInfo.username} (${botInfo.first_name})`);
  
  // Set up webhook
  console.log('\n📡 Setting up webhook for real-time message handling');
  const useWebhook = await prompt('Do you want to set up a webhook for this bot? (y/n): ');
  
  if (useWebhook.toLowerCase() === 'y') {
    const webhookUrl = await prompt('Enter the webhook URL for your ElizaOS instance: ');
    
    console.log('\n🔄 Setting webhook...');
    const webhookResult = await setWebhook(token, webhookUrl);
    
    if (webhookResult && webhookResult.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      console.error('❌ Failed to set webhook');
    }
  } else {
    console.log('📝 No webhook set. You will need to handle messages with polling.');
  }
  
  // Save token to .env file
  const saveToken = await prompt('\nDo you want to save this token to your .env file? (y/n): ');
  
  if (saveToken.toLowerCase() === 'y') {
    const fs = require('fs');
    
    try {
      // Read current .env file
      let envContent = '';
      try {
        envContent = fs.readFileSync('.env', 'utf8');
      } catch (error) {
        // File might not exist, create it
        console.log('Creating new .env file...');
      }
      
      // Check if TELEGRAM_BOT_TOKEN already exists
      if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
        // Replace existing token
        envContent = envContent.replace(
          /TELEGRAM_BOT_TOKEN=.*/,
          `TELEGRAM_BOT_TOKEN=${token}`
        );
      } else {
        // Add token to file
        envContent += `\n# Telegram Bot Token\nTELEGRAM_BOT_TOKEN=${token}\n`;
      }
      
      // Write back to .env file
      fs.writeFileSync('.env', envContent);
      console.log('✅ Token saved to .env file');
    } catch (error) {
      console.error('❌ Failed to save token to .env file:', error.message);
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Update your ElizaOS configuration to use this Telegram bot');
  console.log('2. Ensure your webhook endpoint is properly configured on your server');
  console.log('3. Test the integration by sending /start to your bot');
  
  console.log('\n======================================================');
  console.log('🤖 Telegram bot setup completed!');
  
  rl.close();
}

// Run setup
setup().catch(error => {
  console.error('❌ Unexpected error:', error);
  rl.close();
}); 