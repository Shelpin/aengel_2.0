/**
 * Bot Interaction Test Script
 * 
 * This script tests the interaction between bots in a Telegram group
 * without relying on environment variable workarounds.
 */

const https = require('https');

// Bot configuration
const bots = [
  {
    name: 'linda_evangelista_88',
    token: process.env.TELEGRAM_BOT_TOKEN_LindAEvangelista88
  },
  {
    name: 'vc_shark_99',
    token: process.env.TELEGRAM_BOT_TOKEN_VCShark99
  },
  {
    name: 'bitcoin_maxi_420',
    token: process.env.TELEGRAM_BOT_TOKEN_BitcoinMaxi420
  }
];

// Chat ID (group where bots should interact)
const CHAT_ID = -1001962002598; // Replace with your group chat ID

/**
 * Send a message to a Telegram chat using a bot
 * 
 * @param {string} token - Bot token
 * @param {number} chatId - Chat ID
 * @param {string} text - Message text
 * @returns {Promise<Object>} - Response from Telegram API
 */
async function sendMessage(token, chatId, text) {
  return new Promise((resolve, reject) => {
    // Build the request data
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    
    // Configure the request options
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // Create request
    const req = https.request(options, (res) => {
      let responseData = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      // Process response when complete
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`✅ Message sent successfully using bot token: ${token.substring(0, 6)}...`);
          resolve(parsedData);
        } catch (e) {
          console.error(`❌ Error parsing response: ${e.message}`);
          reject(e);
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error(`❌ Error sending message: ${error.message}`);
      reject(error);
    });
    
    // Send the request
    req.write(data);
    req.end();
  });
}

/**
 * Run the test sequence
 */
async function runTest() {
  console.log('🤖 Starting Bot Interaction Test...');
  
  try {
    // 1. First bot sends a message with a question
    const firstBot = bots[0];
    console.log(`📤 Bot ${firstBot.name} is sending a message...`);
    await sendMessage(
      firstBot.token,
      CHAT_ID,
      "Hey everyone, what do you think about the future of AI? @bitcoin_maxi_420 @vc_shark_99"
    );
    
    // 2. Wait for a response (bots should process and respond)
    console.log('⏳ Waiting for bots to process messages...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Second bot sends a message with a specific question to the third bot
    const secondBot = bots[1];
    console.log(`📤 Bot ${secondBot.name} is sending a message...`);
    await sendMessage(
      secondBot.token,
      CHAT_ID,
      "@bitcoin_maxi_420 Do you think AI will have an impact on cryptocurrency markets?"
    );
    
    // 4. Wait for a response
    console.log('⏳ Waiting for bots to process messages...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Third bot sends a message without tagging anyone
    const thirdBot = bots[2];
    console.log(`📤 Bot ${thirdBot.name} is sending a message...`);
    await sendMessage(
      thirdBot.token,
      CHAT_ID,
      "I think AI and blockchain technologies will converge in interesting ways."
    );
    
    console.log('✅ Test sequence completed!');
    console.log('📝 Check your Telegram group to see if the bots are responding appropriately.');
    console.log('💡 If bots are not responding, check the logs for any errors.');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
runTest(); 