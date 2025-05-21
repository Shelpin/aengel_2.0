/**
 * Direct Message Test Script
 * 
 * This script sends a direct message to a Telegram chat and tags a specific bot
 * to test if it responds with a proper LLM-generated response.
 */

const https = require('https');

// Chat ID where bots are present
const CHAT_ID = -1001962002598;

// Target bot to tag in the message
const TARGET_BOT = "bitcoin_maxi_420";

// Message to send (with a specific instruction to verify LLM usage)
const MESSAGE = `@${TARGET_BOT} Please analyze the current Bitcoin market trends and tell me your opinion on the Bitcoin halving that is approaching. Also, can you say the words "LLM RUNTIME VERIFIED" somewhere in your response to prove you're using the AI system?`;

// Bot token to use for sending (we'll use Linda's token)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_LindAEvangelista88;

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
 * Run the test
 */
async function runTest() {
  console.log('🤖 Starting Direct Message Test...');
  console.log(`📤 Sending message to chat ${CHAT_ID} targeting @${TARGET_BOT}...`);
  
  try {
    const result = await sendMessage(BOT_TOKEN, CHAT_ID, MESSAGE);
    console.log('✅ Message sent successfully!');
    console.log('📝 Check your Telegram group to see if the bot responds with an LLM-generated message.');
    console.log('💡 A proper response should include "LLM RUNTIME VERIFIED" somewhere in the text.');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
runTest(); 