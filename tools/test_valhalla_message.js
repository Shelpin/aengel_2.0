// Simple test script to verify the handleMessage implementation

// Mock runtime
const mockRuntime = {
  character: {
    name: "ETHMemeLord9000",
    bio: "I'm a crypto enthusiast who loves Ethereum and memes!"
  },
  
  // Simplified handleMessage implementation
  handleMessage: async (msg) => {
    console.log(`[TEST] Received message: ${JSON.stringify(msg)}`);
    
    // Extract message details
    const sender = msg.from?.username || msg.from?.id || 'unknown';
    const messageText = msg.text || '';
    const chatId = msg.chat?.id;
    
    console.log(`[TEST] Processing message: "${messageText}" from ${sender}`);
    
    // Create a static response
    const staticResponse = `Hi there! I'm ETHMemeLord9000. I received your message${messageText ? ': "' + messageText.substring(0, 30) + '..."' : ''}.
    
As ETHMemeLord9000, I'd say Ethereum has a bright future! ETH is the backbone of DeFi and NFTs. Bullish!`;
    
    return {
      text: staticResponse,
      content: {
        action: "SAY",
        text: staticResponse
      }
    };
  }
};

// Test function to call handleMessage
async function testHandleMessage() {
  try {
    console.log("[TEST] Starting handleMessage test...");
    
    // Create a test message
    const testMessage = {
      message_id: 999999,
      from: {
        id: 12345,
        is_bot: false,
        first_name: "ValhallaTester",
        username: "valhalla_test"
      },
      chat: {
        id: 12345,
        type: "group",
        title: "Valhalla Test Group"
      },
      date: Math.floor(Date.now() / 1000),
      text: "What's your opinion on Ethereum's future?",
    };
    
    console.log(`[TEST] Calling handleMessage with test message`);
    
    // Call handleMessage
    const response = await mockRuntime.handleMessage(testMessage);
    
    console.log("[TEST] Response received:");
    console.log(JSON.stringify(response, null, 2));
    
    console.log("[TEST] Test completed successfully!");
  } catch (error) {
    console.error(`[TEST] Error during test: ${error.message}`);
    if (error.stack) {
      console.error(`[TEST] Stack trace: ${error.stack}`);
    }
  }
}

// Run the test
testHandleMessage(); 