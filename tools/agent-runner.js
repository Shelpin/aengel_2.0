#!/usr/bin/env node

/**
 * ElizaOS Agent Runner
 * This script demonstrates the execution of the ElizaOS agent with all patches
 */

console.log('🚀 Starting ElizaOS agent runner...');

// Initialize database
console.log('🔧 Initializing database...');
require('./patches/init_db.cjs');

// Create a mock telegram client
console.log('🔧 Creating mock Telegram client...');

class TelegramClientMock {
    constructor(options = {}) {
        this.token = options.token || 'mock-token';
        this.options = options;
        this.eventHandlers = {};
        this.messageHandlers = {};
        console.log('📱 Mock Telegram client initialized with token:', this.token.substring(0, 5) + '...');
    }

    async startPolling() {
        console.log('📱 Mock Telegram client polling started');

        // Simulate receiving messages periodically
        this.pollingInterval = setInterval(() => {
            console.log('📱 Simulating incoming message...');
            const text = "Hello there!";
            const message = {
                message_id: Date.now(),
                from: {
                    id: 123456789,
                    first_name: 'Test',
                    last_name: 'User',
                    username: 'testuser'
                },
                chat: {
                    id: -1002550681173,
                    title: 'Test Group',
                    type: 'group'
                },
                text: text,
                date: Math.floor(Date.now() / 1000)
            };

            console.log(`📱 Mock Telegram message received: "${text}" from testuser`);

            // Trigger message handlers
            if (this.eventHandlers['message']) {
                try {
                    this.eventHandlers['message'](message);
                } catch (error) {
                    console.error('📱 Error in message handler:', error);
                }
            }
        }, 5000); // Every 5 seconds

        return true;
    }

    async stopPolling() {
        console.log('📱 Mock Telegram client polling stopped');
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        return true;
    }

    async sendMessage(chatId, text, options = {}) {
        console.log(`📱 Mock Telegram client sending message to ${chatId}: "${text.substring(0, 50)}..."`);

        // Create a mock response
        const response = {
            message_id: Date.now(),
            from: {
                id: 987654321,
                first_name: 'Bot',
                username: 'ElizaBot'
            },
            chat: {
                id: chatId,
                type: chatId.toString().startsWith('-') ? 'group' : 'private'
            },
            text: text,
            date: Math.floor(Date.now() / 1000)
        };

        return {
            ok: true,
            result: response
        };
    }

    on(event, handler) {
        console.log(`📱 Mock Telegram client registering handler for "${event}" event`);
        this.eventHandlers[event] = handler;
    }

    onText(regex, handler) {
        console.log(`📱 Mock Telegram client registering text handler for regex: ${regex.toString()}`);
        this.messageHandlers[regex.toString()] = handler;
    }
}

// Create a simple runtime
const runtime = {
    name: 'ElizaOS Demo Runtime',
    version: '1.0.0',

    async handleMessage(message) {
        console.log(`🧠 Handling message: ${JSON.stringify(message).substring(0, 100)}...`);

        // Echo the message
        return {
            type: 'text',
            content: `Echo: ${message.text || message.content}`,
            source: 'runtime',
            target: 'telegram'
        };
    }
};

// Make runtime globally available
globalThis.__elizaRuntime = runtime;
console.log('✅ Runtime initialized and made globally available');

// Make telegram client globally available
globalThis.__elizaTelegramClient = { TelegramClient: TelegramClientMock };
console.log('✅ Telegram client mock initialized and made globally available');

// Create an instance of the Telegram client
const telegramClient = new TelegramClientMock({ token: 'test-token-12345' });

// Register message handler
telegramClient.on('message', async (message) => {
    console.log(`📥 Received message: ${message.text}`);

    // Process with runtime
    const response = await runtime.handleMessage({
        type: 'text',
        content: message.text,
        text: message.text,
        source: 'telegram',
        target: 'agent'
    });

    // Send response
    console.log(`📤 Sending response: ${response.content}`);
    await telegramClient.sendMessage(message.chat.id, response.content);
});

// Start polling
console.log('🚀 Starting agent...');
telegramClient.startPolling();

// Keep process running
console.log('✅ Agent running and processing messages');
console.log('Press Ctrl+C to exit');

// Handle exit
process.on('SIGINT', () => {
    console.log('🛑 Stopping agent...');
    telegramClient.stopPolling();
    process.exit(0);
}); 