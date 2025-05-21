#!/usr/bin/env node
/**
 * Test Aeternity Tipping Functionality
 * 
 * This script demonstrates how to use the Aeternity plugin's tipping functionality
 * in standalone mode without requiring the full ElizaOS agent.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup paths and environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  fg: {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m"
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color, prefix;
  
  switch(type) {
    case 'success': color = colors.fg.green; prefix = 'SUCCESS'; break;
    case 'error': color = colors.fg.red; prefix = 'ERROR'; break;
    case 'warning': color = colors.fg.yellow; prefix = 'WARNING'; break;
    case 'info': default: color = colors.fg.blue; prefix = 'INFO'; break;
  }
  
  console.log(`${color}[${timestamp}] ${prefix}:${colors.reset} ${message}`);
}

// Mock runtime to simulate ElizaOS services
class MockElizaRuntime {
  agentId = 'aeternity-standalone-agent';
  services = {};
  userAddresses = {};
  pendingTips = [];
  
  constructor() {
    this.logger = {
      info: (...args) => log(args.join(' '), 'info'),
      error: (...args) => log(args.join(' '), 'error'),
      debug: (...args) => log(args.join(' '), 'debug'),
      warn: (...args) => log(args.join(' '), 'warning'),
      success: (...args) => log(args.join(' '), 'success')
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
  
  getService(serviceType) {
    return this.services[serviceType];
  }
  
  // Mock methods for telegram functionality
  async sendDirectMessage(username, message) {
    log(`Sending DM to @${username}: "${message}"`, 'info');
    return true;
  }
  
  async sendMessage(chatId, message) {
    log(`Sending message to chat ${chatId}: "${message}"`, 'info');
    return true;
  }
  
  // User address storage
  storeUserAddress(username, address) {
    this.userAddresses[username] = address;
    log(`Stored address for @${username}: ${address}`, 'success');
    return true;
  }
  
  getUserAddress(username) {
    return this.userAddresses[username];
  }
  
  // Pending tips management
  storePendingTip(tip) {
    this.pendingTips.push(tip);
    log(`Stored pending tip for @${tip.recipient}: ${tip.amount} AE`, 'info');
    return true;
  }
  
  getPendingTips(username) {
    return this.pendingTips.filter(tip => tip.recipient === username);
  }
  
  clearPendingTips(username) {
    this.pendingTips = this.pendingTips.filter(tip => tip.recipient !== username);
    return true;
  }
  
  // Helper to emulate handler adapter
  getSetting(key) {
    return process.env[key];
  }
}

async function main() {
  console.log('\n========== AETERNITY TIPPING TEST ==========\n');
  
  try {
    // Load the plugin
    log('Importing Aeternity plugin...', 'info');
    const pluginModule = await import('./dist/index.js');
    const plugin = pluginModule.default || pluginModule;
    
    if (!plugin || !plugin.actions) {
      throw new Error('Failed to load plugin or no actions found');
    }
    
    log(`Plugin loaded: ${plugin.name}`, 'success');
    log(`Found ${plugin.actions.length} actions`, 'info');
    
    // Create runtime and initialize services
    const runtime = new MockElizaRuntime();
    
    // Initialize the services if the plugin has any
    if (plugin.services && plugin.services.length > 0) {
      for (const service of plugin.services) {
        if (service.initialize) {
          await service.initialize(runtime);
        }
        runtime.registerService(service);
      }
      log('Services initialized', 'success');
    } else {
      log('No services to initialize', 'warning');
    }
    
    // Find the tipping action
    const tipAction = plugin.actions.find(action => action.name === 'TIP_TELEGRAM_USER');
    const addressRegistrationAction = plugin.actions.find(action => action.name === 'PROCESS_ADDRESS_REGISTRATION');
    const catchAddressAction = plugin.actions.find(action => action.name === 'CATCH_ADDRESS_INPUT');
    
    if (!tipAction || !tipAction.handler) {
      throw new Error('TIP_TELEGRAM_USER action not found or has no handler');
    }
    
    // Demo: Register a user address
    if (addressRegistrationAction && addressRegistrationAction.handler) {
      log('\n--- REGISTERING USER ADDRESS ---', 'info');
      
      const params = {
        username: 'testuser',
        address: 'ak_2KAcA2Pp1nrR8Wkt3FtCkReGzAi8vJ9Snxa4PcmrthVx8AhPe',
        chatId: 'test_chat_123'
      };
      
      log(`Registering address for @${params.username}: ${params.address}`, 'info');
      
      try {
        const result = await addressRegistrationAction.handler(runtime, null, {}, params);
        log('Registration result:', 'success');
        console.log(result);
      } catch (error) {
        log(`Failed to register address: ${error.message}`, 'error');
      }
    }
    
    // Demo: Tip a user with auto-amount
    log('\n--- TIPPING USER WITH AUTO-AMOUNT ---', 'info');
    
    const tipParams = {
      recipient: 'testuser',
      contributionDescription: 'Provided an excellent explanation of Aeternity state channels with clear examples.',
      message: 'Thank you for your valuable contribution!',
      chatId: 'test_chat_123'
    };
    
    log(`Tipping @${tipParams.recipient} for: "${tipParams.contributionDescription}"`, 'info');
    
    try {
      const result = await tipAction.handler(runtime, null, {}, tipParams);
      log('Tipping result:', 'success');
      console.log(result);
    } catch (error) {
      log(`Failed to tip user: ${error.message}`, 'error');
      console.error(error);
    }
    
    // Demo: Tip a user with specific amount
    log('\n--- TIPPING USER WITH SPECIFIC AMOUNT ---', 'info');
    
    const specificTipParams = {
      recipient: 'testuser',
      amount: '1.5',
      message: 'Custom tip amount example',
      chatId: 'test_chat_123'
    };
    
    log(`Tipping @${specificTipParams.recipient}: ${specificTipParams.amount} AE`, 'info');
    
    try {
      const result = await tipAction.handler(runtime, null, {}, specificTipParams);
      log('Tipping result:', 'success');
      console.log(result);
    } catch (error) {
      log(`Failed to tip user: ${error.message}`, 'error');
      console.error(error);
    }
    
    // Demo: Catch address input (simulating user DM response)
    if (catchAddressAction && catchAddressAction.handler) {
      log('\n--- PROCESSING USER ADDRESS REPLY ---', 'info');
      
      // First create a pending tip
      runtime.storePendingTip({
        recipient: 'newuser',
        amount: '0.5',
        message: 'For testing address input',
        timestamp: Date.now()
      });
      
      const addressParams = {
        userId: 'newuser_id_123',
        username: 'newuser',
        text: 'ak_542o93BKHiANzqNaFj6UurrJuDuxU61zCGr9LJCwtTUg34kWt', // Address input
        chatId: 'direct_message_chat'
      };
      
      log(`Processing address input from @${addressParams.username}: "${addressParams.text}"`, 'info');
      
      try {
        const result = await catchAddressAction.handler(runtime, {
          userId: addressParams.userId,
          content: { text: addressParams.text }
        }, {}, addressParams);
        
        log('Address processing result:', 'success');
        console.log(result);
      } catch (error) {
        log(`Failed to process address: ${error.message}`, 'error');
        console.error(error);
      }
    }
    
    log('\n========== TEST COMPLETE ==========\n', 'success');
    
  } catch (error) {
    log('Test failed with error:', 'error');
    console.error(error);
  }
}

main(); 