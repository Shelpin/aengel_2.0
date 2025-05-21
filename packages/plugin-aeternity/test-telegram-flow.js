#!/usr/bin/env node
/**
 * Test script for Aeternity Telegram tipping flow
 * This simulates the complete workflow of tipping a Telegram user
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m", 
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m"
};

// Log function with colors
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'success': `${colors.green}✓ SUCCESS${colors.reset}`,
    'error': `${colors.red}✗ ERROR${colors.reset}`,
    'warning': `${colors.yellow}⚠ WARNING${colors.reset}`,
    'info': `${colors.blue}ℹ INFO${colors.reset}`,
    'step': `${colors.cyan}→ STEP${colors.reset}`,
    'debug': `${colors.gray}· DEBUG${colors.reset}`
  }[type] || `${colors.blue}ℹ INFO${colors.reset}`;
  
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

// In-memory database for testing
class MemoryStore {
  constructor() {
    this.data = new Map();
  }
  
  set(key, value) {
    this.data.set(key, value);
    log(`Memory store: Set ${key} = ${JSON.stringify(value)}`, 'debug');
    return true;
  }
  
  get(key) {
    const value = this.data.get(key);
    log(`Memory store: Get ${key} = ${JSON.stringify(value)}`, 'debug');
    return value;
  }
  
  has(key) {
    return this.data.has(key);
  }
  
  list() {
    return Array.from(this.data.keys());
  }
  
  delete(key) {
    return this.data.delete(key);
  }
}

// Minimal runtime with memory for Telegram tipping flow
class TestRuntime {
  constructor() {
    this.agentId = 'telegram-test-agent';
    this.services = {};
    this.memory = new MemoryStore();
    this.plugins = []; // Add plugins array
    
    // Mock Telegram client
    this.clients = {
      telegram: new MockTelegramClient(this)
    };
    
    // Logger implementation
    this.logger = {
      info: (...args) => log(args.join(' '), 'info'),
      error: (...args) => log(args.join(' '), 'error'),
      debug: (...args) => log(args.join(' '), 'debug'),
      warn: (...args) => log(args.join(' '), 'warning')
    };
  }
  
  registerService(service) {
    const serviceName = service.constructor?.serviceType || service.constructor?.name || 'Unknown';
    log(`Registered service: ${serviceName}`, 'success');
    
    if (service.constructor?.serviceType) {
      this.services[service.constructor.serviceType] = service;
    }
    return service;
  }
  
  // Add getService method
  async getService(serviceType) {
    return this.services[serviceType];
  }
  
  getSetting(key) {
    return process.env[key];
  }
}

// Mock Telegram client that can simulate messages
class MockTelegramClient {
  constructor(runtime) {
    this.runtime = runtime;
    this.name = 'telegram';
    this.description = 'Mock Telegram client for testing';
    this.sentMessages = [];
  }
  
  async initialize() {
    log('Initialized Mock Telegram client', 'success');
    return this;
  }
  
  // Simulate sending message to chat
  async sendMessage(chatId, text, options = {}) {
    log(`[TELEGRAM] To ${chatId}: ${text}`, 'info');
    this.sentMessages.push({ chatId, text, options });
    return { message_id: Math.floor(Math.random() * 1000) };
  }
  
  // Simulate receiving a message from a user
  simulateIncomingMessage(userId, chatId, text) {
    log(`[TELEGRAM] From user ${userId} in chat ${chatId}: ${text}`, 'step');
    
    const msg = {
      id: Math.floor(Math.random() * 1000),
      content: { text },
      chat: { id: chatId },
      from: { id: userId, first_name: 'Test', last_name: 'User', username: 'testuser' }
    };
    
    return msg;
  }
}

// Add this function to initialize plugin services
async function initializePluginServices(plugin, runtime) {
  if (!plugin.services || !Array.isArray(plugin.services) || plugin.services.length === 0) {
    log('Plugin has no services to initialize', 'warning');
    return;
  }
  
  log(`Initializing ${plugin.services.length} plugin services...`, 'info');
  
  for (const service of plugin.services) {
    if (typeof service.initialize === 'function') {
      try {
        await service.initialize(runtime);
        if (service.constructor && service.constructor.serviceType) {
          runtime.services[service.constructor.serviceType] = service;
          log(`Registered service: ${service.constructor.serviceType}`, 'success');
        }
      } catch (err) {
        log(`Failed to initialize service: ${err.message}`, 'error');
      }
    }
  }
}

/**
 * Test the complete Telegram tipping flow
 */
async function testTelegramTippingFlow() {
  try {
    log('=== Testing Aeternity Telegram Tipping Flow ===', 'info');
    log('This test simulates the full lifecycle of tipping on Telegram', 'info');
    
    // 1. Create runtime and load plugin
    log('\n1. Setting up test environment', 'step');
    const runtime = new TestRuntime();
    
    // Load the plugin
    const pluginPath = path.join(__dirname, 'dist/index.js');
    if (!fs.existsSync(pluginPath)) {
      log(`Plugin not found at ${pluginPath}. Make sure to build it first.`, 'error');
      return false;
    }
    
    const pluginModule = await import(pluginPath);
    const plugin = pluginModule.default || pluginModule;
    log(`Loaded plugin: ${plugin.name}`, 'success');
    
    // Add the plugin to runtime.plugins
    runtime.plugins.push(plugin);
    
    // Find the actions
    const tipAction = plugin.actions.find(a => a.name === 'TIP_TELEGRAM_USER');
    const processAddressAction = plugin.actions.find(a => a.name === 'PROCESS_ADDRESS_REGISTRATION');
    const catchAddressAction = plugin.actions.find(a => a.name === 'CATCH_ADDRESS_INPUT');
    
    if (!tipAction || !processAddressAction || !catchAddressAction) {
      log('Missing required actions in the plugin', 'error');
      return false;
    }
    
    // Initialize any services the plugin might have
    await initializePluginServices(plugin, runtime);
    
    // 2. Simulate a tip command in a group chat
    log('\n2. Simulating tip command in a group chat', 'step');
    const tipperUserId = '12345';
    const tipperChatId = '-100123456789'; // Group chat
    const tipRecipientUsername = 'cryptolover';
    const tipAmount = '1.5';
    
    const tipCommandMsg = runtime.clients.telegram.simulateIncomingMessage(
      tipperUserId, 
      tipperChatId, 
      `/tip @${tipRecipientUsername} ${tipAmount} AE`
    );
    
    // 3. Trigger the TIP_TELEGRAM_USER action
    log('\n3. Processing tip command', 'step');
    const tipResult = await tipAction.handler({
      recipient: `@${tipRecipientUsername}`,
      amount: tipAmount,
      chatId: tipCommandMsg.chat.id.toString(),
      message: `Tipping @${tipRecipientUsername} ${tipAmount} AE for their great contribution!`,
      // We're passing the Telegram message, but this isn't part of the expected schema
      // This is for compatibility with how ElizaOS might integrate
      msg: tipCommandMsg
    }, runtime);
    
    log(`Tip action result: ${JSON.stringify(tipResult)}`, 'info');
    
    // Check if we sent a message asking for address
    const askForAddressMessage = runtime.clients.telegram.sentMessages.find(
      m => m.text.includes('I don\'t have your Aeternity wallet address')
    );
    
    if (!askForAddressMessage) {
      log('Expected system to ask for wallet address', 'error');
      return false;
    }
    
    log('System correctly asked recipient for wallet address', 'success');
    
    // 4. Simulate recipient sending their address in DM
    log('\n4. Simulating recipient sending wallet address', 'step');
    const recipientUserId = '67890';
    const recipientDmChatId = recipientUserId; // DM chat ID is the same as user ID
    const fakeAddress = 'ak_2QkttUgEyPixKzpZm7ZQ8pUDX4ySA6AEqZsgS79zJQCT5jnKew';
    
    const addressMsg = runtime.clients.telegram.simulateIncomingMessage(
      recipientUserId,
      recipientDmChatId,
      fakeAddress
    );
    
    // 5. Trigger the CATCH_ADDRESS_INPUT action
    log('\n5. Processing address input', 'step');
    const catchResult = await catchAddressAction.handler({
      text: addressMsg.content.text,
      chatId: addressMsg.chat.id,
      userId: addressMsg.from.id,
      messageId: addressMsg.id,
      msg: addressMsg
    }, runtime);
    
    log(`Address catch result: ${JSON.stringify(catchResult)}`, 'info');
    
    // 6. Check if address was stored
    log('\n6. Verifying address storage', 'step');
    const addressKey = `wallet:${recipientUserId}`;
    const storedAddress = runtime.memory.get(addressKey);
    
    if (!storedAddress || storedAddress !== fakeAddress) {
      log(`Address not stored correctly. Expected: ${fakeAddress}, Got: ${storedAddress}`, 'error');
      return false;
    }
    
    log('Wallet address stored successfully in memory', 'success');
    
    // 7. Trigger the PROCESS_ADDRESS_REGISTRATION action
    log('\n7. Processing address registration', 'step');
    const processResult = await processAddressAction.handler({
      userId: recipientUserId,
      address: fakeAddress
    }, runtime);
    
    log(`Process result: ${JSON.stringify(processResult)}`, 'info');
    
    // Check if confirmation message was sent
    const confirmationMessage = runtime.clients.telegram.sentMessages.find(
      m => m.text.includes('confirmed') || m.text.includes('registered') || m.text.includes('success')
    );
    
    if (!confirmationMessage) {
      log('Expected confirmation message after address registration', 'warning');
    } else {
      log('Address registration confirmation sent', 'success');
    }
    
    log('\n=== Telegram Tipping Flow Test Complete ===', 'success');
    log('The workflow shows the plugin correctly processes the tipping flow', 'info');
    
    return true;
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error.stack);
    return false;
  }
}

// Run the test
testTelegramTippingFlow(); 