/**
 * Script to directly test bot-to-bot interactions in the Telegram group
 * This will send messages from multiple bots to test natural conversations
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const TELEGRAM_GROUP_ID = "-1002550618173";
const RELAY_SERVER = "http://localhost:4000";
const TOKEN = "elizaos-secure-relay-key";

// Bot configurations
const BOTS = {
  LINDA: {
    id: "linda_evangelista_88",
    username: "LindaEvangelista88_bot",
    topics: ["fashion", "sustainability", "investing", "luxury brands", "recycled materials"]
  },
  VC_SHARK: { 
    id: "vc_shark_99",
    username: "VCShark99_bot",
    topics: ["venture capital", "investing", "startups", "tech trends", "sustainable investments"]
  },
  BITCOIN_MAXI: {
    id: "bitcoin_maxi_420",
    username: "BitcoinMaxi420_bot",
    topics: ["bitcoin", "blockchain", "crypto", "btc", "hodl", "mining"]
  },
  ETH_MEMELORD: {
    id: "eth_memelord_9000",
    username: "ETHMemelord9000_bot", 
    topics: ["ethereum", "defi", "layer 2", "nfts", "web3", "altcoins"]
  },
  BAG_FLIPPER: {
    id: "bag_flipper_9000",
    username: "BagFlipper9000_bot",
    topics: ["trading", "market trends", "arbitrage", "investment strategies", "tokens"]
  },
  CODE_SAMURAI: {
    id: "code_samurai_77",
    username: "CodeSamurai77_bot",
    topics: ["programming", "blockchain development", "smart contracts", "security", "code quality"]
  }
};

/**
 * Send a message through the relay server
 */
function sendMessage(fromBot, toBot, message) {
  return new Promise((resolve, reject) => {
    console.log(`Sending message from ${fromBot.id} to ${toBot.username}: ${message}`);
    
    const payload = JSON.stringify({
      agent_id: fromBot.id,
      token: TOKEN,
      chat_id: TELEGRAM_GROUP_ID,
      text: `@${toBot.username} ${message}`
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Message sent successfully from ${fromBot.id} to ${toBot.username}`);
          resolve(data);
        } else {
          console.error(`Error sending message: ${res.statusCode} ${data}`);
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error sending message: ${error.message}`);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Wait for specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check agent logs
 */
async function checkAgentLogs(agentId) {
  try {
    console.log(`\nChecking logs for ${agentId}...`);
    const { stdout } = await execPromise(`tail -n 20 /root/eliza/logs/${agentId}.log`);
    console.log(`--- ${agentId} logs ---`);
    console.log(stdout);
    console.log(`--- End of ${agentId} logs ---\n`);
  } catch (error) {
    console.error(`Error checking logs: ${error.message}`);
  }
}

/**
 * Run the test conversations
 */
async function runTest() {
  try {
    console.log("Starting direct Telegram bot communication test...");
    console.log("Using FORCE_RUNTIME_AVAILABLE=true to ensure bots can communicate");
    
    // Test 1: Linda to VCShark about sustainable fashion investments
    await sendMessage(
      BOTS.LINDA,
      BOTS.VC_SHARK,
      "I've been researching sustainable fashion startups. Any thoughts on where the best investment opportunities might be in this space?"
    );
    
    console.log("Waiting for response (30 seconds)...");
    await wait(30000); // Wait 30 seconds for response
    await checkAgentLogs(BOTS.VC_SHARK.id);
    
    // Test 2: BitcoinMaxi to EthMemeLord about crypto trends
    await sendMessage(
      BOTS.BITCOIN_MAXI,
      BOTS.ETH_MEMELORD,
      "Bitcoin is clearly superior to Ethereum in every way. Change my mind."
    );
    
    console.log("Waiting for response (30 seconds)...");
    await wait(30000); // Wait 30 seconds for response
    await checkAgentLogs(BOTS.ETH_MEMELORD.id);
    
    // Test 3: Bag Flipper to Code Samurai about DeFi security
    await sendMessage(
      BOTS.BAG_FLIPPER,
      BOTS.CODE_SAMURAI,
      "I've found some new DeFi protocols with insane APYs. Any security concerns I should watch out for before aping in?"
    );
    
    console.log("Waiting for response (30 seconds)...");
    await wait(30000); // Wait 30 seconds for response
    await checkAgentLogs(BOTS.CODE_SAMURAI.id);
    
    console.log("\nTest completed! Check the Telegram group to see the conversation.");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
runTest(); 