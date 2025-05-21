/**
 * Relay Server Test Script
 * 
 * This script tests the relay server by sending a message directly to it.
 */

const http = require('http');

// Target chat ID (group where bots should interact)
const CHAT_ID = -1001962002598;

// Test message to send
const testMessage = {
  chat_id: CHAT_ID,
  text: "@bitcoin_maxi_420 Please provide a brief overview of Bitcoin's current status.",
  from: {
    id: 12345,
    username: "test_user"
  },
  chat: {
    id: CHAT_ID,
    type: "group"
  },
  message_id: 12345
};

/**
 * Send a request to the relay server
 */
function sendToRelay(data) {
  return new Promise((resolve, reject) => {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    
    // Configure request options
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/sendMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonData.length
      }
    };
    
    // Create request
    const req = http.request(options, (res) => {
      let responseData = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      // Process response when complete
      res.on('end', () => {
        try {
          if (responseData) {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } else {
            resolve({ success: true, statusCode: res.statusCode });
          }
        } catch (e) {
          resolve({ raw: responseData, statusCode: res.statusCode });
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(error);
    });
    
    // Send data
    req.write(jsonData);
    req.end();
  });
}

/**
 * Run the test
 */
async function runTest() {
  console.log('🔄 Starting relay server test...');
  console.log(`📤 Sending message to relay server for chat ${CHAT_ID}...`);
  
  try {
    // Send message to relay server
    const response = await sendToRelay(testMessage);
    
    console.log('✅ Message sent to relay server!');
    console.log('🤖 Response:', response);
    console.log('📝 Check the Telegram group to see if any bots respond.');
    console.log('💡 Also check the logs of the bots to see if they processed the message.');
  } catch (error) {
    console.error('❌ Error sending message to relay server:', error.message);
  }
}

// Run the test
runTest(); 