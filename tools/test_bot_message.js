/**
 * Test Bot Message Processing Script
 * 
 * This script directly tests a bot's message processing functionality
 * without relying on Telegram or the relay server.
 */

const http = require('http');

// Target agent to test
const TARGET_AGENT = 'bitcoin_maxi_420';

// Test message that simulates a Telegram message
const testMessage = {
  chat_id: -1001962002598,
  text: `@${TARGET_AGENT} Please analyze Bitcoin's recent price action.`,
  from: { 
    id: 111111, 
    first_name: 'Tester',
    username: 'test_user'
  },
  chat: {
    id: -1001962002598,
    type: 'group'
  },
  message_id: 12345,
  sender_agent_id: 'test_user'
};

/**
 * Send a request using Node's http module
 * 
 * @param {Object} options - Request options
 * @param {Object} data - Data to send
 * @returns {Promise<Object>} - Response data
 */
function sendRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
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
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      const jsonData = JSON.stringify(data);
      req.write(jsonData);
    }
    
    req.end();
  });
}

/**
 * Send a test message directly to the agent's API
 */
async function testDirectMessage() {
  console.log(`🔍 Testing direct message processing for ${TARGET_AGENT}...`);
  
  try {
    // Find port number based on agent (standard port allocation)
    const portMap = {
      'eth_memelord_9000': 3000,
      'bag_flipper_9000': 3001,
      'linda_evangelista_88': 3002,
      'vc_shark_99': 3003,
      'bitcoin_maxi_420': 3004,
      'code_samurai_77': 3005
    };
    
    const port = portMap[TARGET_AGENT] || 3004;
    console.log(`📡 Sending to agent on port ${port}...`);
    
    // Send message directly to agent's API
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await sendRequest(options, testMessage);
    
    console.log('✅ Message sent successfully!');
    console.log('🤖 Response:', response);
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

/**
 * Test message processing via the TelegramMultiAgentPlugin
 */
async function testPluginMessage() {
  console.log(`🔍 Testing TelegramMultiAgentPlugin message processing for ${TARGET_AGENT}...`);
  
  try {
    const portMap = {
      'eth_memelord_9000': 3000,
      'bag_flipper_9000': 3001,
      'linda_evangelista_88': 3002,
      'vc_shark_99': 3003,
      'bitcoin_maxi_420': 3004,
      'code_samurai_77': 3005
    };
    
    const port = portMap[TARGET_AGENT] || 3004;
    
    // Format similar to what TelegramMultiAgentPlugin would receive
    const pluginMessage = {
      ...testMessage,
      type: 'telegram_message',
      agent_id: TARGET_AGENT
    };
    
    console.log(`📡 Sending to TelegramMultiAgentPlugin on port ${port}...`);
    
    // Send to plugin endpoint
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/plugin/telegram-multiagent/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await sendRequest(options, pluginMessage);
    
    console.log('✅ Plugin message sent successfully!');
    console.log('🤖 Response:', response);
  } catch (error) {
    console.error('❌ Error sending plugin message:', error.message);
  }
}

// Run both tests
async function runTests() {
  console.log('🚀 Starting bot message processing tests...');
  
  try {
    await testDirectMessage();
    console.log('\n------------------------------------\n');
    await testPluginMessage();
  } catch (error) {
    console.error('⛔ Test execution error:', error);
  }
  
  console.log('🏁 Tests completed!');
}

// Run the tests
runTests(); 