/**
 * Relay Server Connection Test
 * 
 * This script tests the connection to the relay server
 * and sends a test message to the group chat.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const RELAY_SERVER_URL = process.env.RELAY_SERVER_URL || 'http://localhost:4000';
const RELAY_AUTH_TOKEN = process.env.RELAY_AUTH_TOKEN || 'elizaos-secure-relay-key';
const TEST_AGENT_ID = 'test_agent_' + Math.floor(Math.random() * 1000);
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_IDS || '-1002550618173';

console.log(`🔧 Configuration:`);
console.log(`   Relay server: ${RELAY_SERVER_URL}`);
console.log(`   Auth token: ${RELAY_AUTH_TOKEN.substring(0, 6)}****`);
console.log(`   Test agent ID: ${TEST_AGENT_ID}`);
console.log(`   Target group ID: ${TELEGRAM_GROUP_ID}`);

// Helper function to make HTTP requests
function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RELAY_AUTH_TOKEN}`
      }
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Register with relay server
async function registerWithRelay() {
  console.log(`🔄 Registering agent ${TEST_AGENT_ID} with relay...`);
  
  try {
    const data = await makeRequest(`${RELAY_SERVER_URL}/register`, 'POST', {
      agent_id: TEST_AGENT_ID
    });
    
    if (data.success) {
      console.log(`✅ Successfully registered with relay!`);
      console.log(`   Connected agents: ${data.connected_agents}`);
      return true;
    } else {
      console.error(`❌ Failed to register with relay: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error registering with relay: ${error.message}`);
    return false;
  }
}

// Send a test message
async function sendTestMessage() {
  console.log(`📤 Sending test message to group ${TELEGRAM_GROUP_ID}...`);
  
  const testMessage = `🤖 This is a test message from ${TEST_AGENT_ID} at ${new Date().toISOString()}. All bots should respond to this message to demonstrate the relay server is working correctly.`;
  
  try {
    const data = await makeRequest(`${RELAY_SERVER_URL}/sendMessage`, 'POST', {
      agent_id: TEST_AGENT_ID,
      chat_id: TELEGRAM_GROUP_ID,
      text: testMessage
    });
    
    if (data.success) {
      console.log(`✅ Successfully sent test message!`);
      console.log(`   Message ID: ${data.message_id}`);
      console.log(`   Recipients: ${data.recipients || 'unknown'}`);
      return true;
    } else {
      console.error(`❌ Failed to send test message: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending test message: ${error.message}`);
    return false;
  }
}

// Poll for responses
async function pollForResponses() {
  console.log(`🔄 Polling for responses...`);
  
  try {
    const data = await makeRequest(`${RELAY_SERVER_URL}/getUpdates?agent_id=${TEST_AGENT_ID}&offset=0`, 'GET');
    
    if (data.success) {
      if (data.messages && data.messages.length > 0) {
        console.log(`✅ Received ${data.messages.length} responses:`);
        
        for (const message of data.messages) {
          if (message.message) {
            const { from, text } = message.message;
            console.log(`   From: ${from.username || from.first_name} (${from.id})`);
            console.log(`   Text: ${text}`);
            console.log(`   ---`);
          }
        }
      } else {
        console.log(`ℹ️ No responses yet...`);
      }
      return true;
    } else {
      console.error(`❌ Failed to poll for responses: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error polling for responses: ${error.message}`);
    return false;
  }
}

// Run full test
async function runTest() {
  // First check relay server health
  try {
    const healthData = await makeRequest(`${RELAY_SERVER_URL}/health`, 'GET');
    
    console.log(`🏥 Relay server health check:`);
    console.log(`   Status: ${healthData.status}`);
    console.log(`   Agents online: ${healthData.agents}`);
    console.log(`   Agents list: ${healthData.agents_list}`);
    console.log(`   Uptime: ${Math.floor(healthData.uptime / 60)} minutes`);
  } catch (error) {
    console.error(`❌ Error checking relay health: ${error.message}`);
    console.error(`   Is the relay server running at ${RELAY_SERVER_URL}?`);
    return;
  }
  
  // Register with relay
  const registered = await registerWithRelay();
  if (!registered) {
    console.error(`🛑 Test aborted: Failed to register with relay server.`);
    return;
  }
  
  // Send test message
  const messageSent = await sendTestMessage();
  if (!messageSent) {
    console.error(`🛑 Test aborted: Failed to send test message.`);
    return;
  }
  
  // Poll for responses a few times
  console.log(`📊 Starting response monitoring (will check 5 times with 5 second intervals)...`);
  
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log(`\n📥 Checking for responses (attempt ${i+1}/5)...`);
    await pollForResponses();
  }
  
  // Unregister when done
  try {
    const unregisterData = await makeRequest(`${RELAY_SERVER_URL}/unregister`, 'POST', {
      agent_id: TEST_AGENT_ID
    });
    
    if (unregisterData.success) {
      console.log(`👋 Successfully unregistered from relay server.`);
    } else {
      console.error(`⚠️ Failed to unregister: ${unregisterData.error}`);
    }
  } catch (error) {
    console.error(`⚠️ Error unregistering: ${error.message}`);
  }
  
  console.log(`\n🏁 Test completed!`);
}

// Run the test
runTest().catch(error => {
  console.error(`💥 Unexpected error: ${error.message}`);
  console.error(error.stack);
}); 