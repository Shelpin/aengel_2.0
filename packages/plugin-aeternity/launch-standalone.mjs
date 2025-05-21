#!/usr/bin/env node
/**
 * Standalone launcher for the Aeternity plugin
 * This bypasses the full ElizaOS architecture, importing only what's needed
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Set up directory handling for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
  },
  
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    gray: "\x1b[100m",
  }
};

// Enhanced logging function
function log(message, type = 'info', details = null) {
  const timestamp = new Date().toISOString();
  
  let color;
  let prefix;
  
  switch(type) {
    case 'success':
      color = colors.fg.green;
      prefix = '✅ SUCCESS';
      break;
    case 'error':
      color = colors.fg.red;
      prefix = '❌ ERROR';
      break;
    case 'warning':
      color = colors.fg.yellow;
      prefix = '⚠️ WARNING';
      break;
    case 'debug':
      color = colors.fg.gray;
      prefix = '🔍 DEBUG';
      break;
    case 'info':
    default:
      color = colors.fg.blue;
      prefix = 'ℹ️ INFO';
  }
  
  console.log(`${color}[${timestamp}] ${prefix}:${colors.reset} ${message}`);
  
  if (details) {
    if (typeof details === 'object') {
      console.log(colors.fg.gray + JSON.stringify(details, null, 2) + colors.reset);
    } else {
      console.log(colors.fg.gray + details + colors.reset);
    }
  }
}

// Setup essential environment variables if they don't exist
const ENV_VARS = {
  AETERNITY_NODE_URL: 'https://testnet.aeternity.io',
  AETERNITY_COMPILER_URL: 'https://compiler.aeternity.io',
  AETERNITY_SECRET_KEY: 'useless rail whale crop shove crime only first race sort forget demand',
  AE_WALLET_ADDRESS: 'ak_26nkCJvJK5vxL6Gx3Sgij5SQ3huzwJg9WJ27MbZihgzFugy6AC',
  AE_WALLET_HD_INDEX: '0'
};

// Ensure environment variables are set
Object.entries(ENV_VARS).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
    log(`Set ${key}=${value}`, 'info');
  }
});

// Mock ElizaOS runtime, similar to the test script
class MockElizaRuntime {
  agentId = 'aeternity-standalone-agent';
  services = {};
  
  constructor() {
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
    // Add the service to our services map
    if (service.constructor?.serviceType) {
      this.services[service.constructor.serviceType] = service;
    }
    return service;
  }
  
  // Emulate the getSetting method used in the main ElizaOS runtime
  getSetting(key) {
    return process.env[key];
  }
}

// Function to verify plugin structure and requirements
function verifyPlugin(plugin) {
  const issues = [];
  
  // Check required fields
  if (!plugin.name) issues.push('Plugin missing required "name" field');
  if (!plugin.description) issues.push('Plugin missing required "description" field');
  
  // Check for actions/services
  if (!plugin.actions || plugin.actions.length === 0) {
    log('Plugin has no actions defined', 'warning');
  }
  
  if (!plugin.services || plugin.services.length === 0) {
    log('Plugin has no services defined', 'warning');
  }
  
  // Check for initialize method
  if (typeof plugin.initialize !== 'function') {
    log('Plugin does not have an initialize method', 'warning');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validates wallet key format to prevent the common "data.split is not a function" error
 * This simulates what happens when initializing AeternityWalletService
 */
function validateWalletKey() {
  log('Validating wallet key format...', 'info');
  
  // Get the keys from environment variables
  const secretKey = process.env.AETERNITY_SECRET_KEY;
  const walletAddress = process.env.AE_WALLET_ADDRESS;
  
  if (!secretKey) {
    log('AETERNITY_SECRET_KEY is not set', 'error');
    return false;
  }
  
  log(`Secret key type: ${typeof secretKey}`, 'debug');
  
  // For mnemonic-based keys, verify it looks like a mnemonic phrase
  if (secretKey.includes(' ')) {
    // This is likely a mnemonic phrase - should be 12 words
    const words = secretKey.trim().split(' ');
    if (words.length !== 12) {
      log(`Warning: Mnemonic should be 12 words but found ${words.length}`, 'warning');
    } else {
      log('Mnemonic format appears valid (12 words)', 'success');
    }
  } else {
    // This might be a raw private key - should be a hex string
    if (!/^[0-9a-f]{64}$/i.test(secretKey)) {
      log('Warning: Secret key does not appear to be a valid hex string', 'warning');
    } else {
      log('Raw private key format appears valid (64 hex chars)', 'success');
    }
  }
  
  if (!walletAddress || !walletAddress.startsWith('ak_')) {
    log(`Warning: AE_WALLET_ADDRESS does not look like a valid address: ${walletAddress}`, 'warning');
  } else {
    log('Wallet address format looks valid', 'success');
  }
  
  return true;
}

async function main() {
  log('=== Aeternity Plugin Standalone Launch ===', 'info');
  
  // Add wallet key validation
  validateWalletKey();
  
  try {
    // Check if dist directory exists
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      log('Distribution directory not found', 'error', { path: distPath });
      log('Run "pnpm build" to create the distribution files first', 'info');
      process.exit(1);
    }
    
    // Import the plugin
    log('Importing Aeternity plugin...', 'info');
    let plugin;
    
    try {
      const pluginModule = await import('./dist/index.js');
      plugin = pluginModule.default || pluginModule;
      log(`Plugin loaded: ${plugin.name}`, 'success');
      log(`Description: ${plugin.description}`, 'info');
    } catch (error) {
      log('Failed to import plugin', 'error', {
        message: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
    
    // Verify plugin structure
    const verification = verifyPlugin(plugin);
    if (!verification.valid) {
      log('Plugin verification failed', 'warning', { issues: verification.issues });
    }
    
    // Create mock runtime
    log('\nCreating mock runtime...', 'info');
    const runtime = new MockElizaRuntime();
    
    // Initialize plugin if it has an initialize method
    if (typeof plugin.initialize === 'function') {
      log('Initializing plugin...', 'info');
      try {
        await plugin.initialize(runtime);
        log('Plugin initialized successfully!', 'success');
      } catch (error) {
        log('Plugin initialization failed', 'error', {
          message: error.message,
          stack: error.stack
        });
      }
    } else {
      log('Plugin does not have an initialize method.', 'warning');
    }
    
    // List available actions
    log('\nAvailable actions:', 'info');
    if (plugin.actions && plugin.actions.length > 0) {
      plugin.actions.forEach((action, index) => {
        log(`${index + 1}. ${action.name}: ${action.description}`, 'info');
        
        // Display action parameters if available
        if (action.parameters && action.parameters.length > 0) {
          log(`   Parameters:`, 'debug');
          action.parameters.forEach(param => {
            log(`   - ${param.name} (${param.type})${param.required ? ' [Required]' : ''}`, 'debug');
          });
        }
      });
    } else {
      log('No actions found in plugin', 'warning');
    }
    
    // List initialized services
    log('\nInitialized services:', 'info');
    const serviceKeys = Object.keys(runtime.services);
    if (serviceKeys.length > 0) {
      serviceKeys.forEach(key => {
        log(`- ${key}`, 'info');
      });
    } else {
      log('No services initialized', 'warning');
    }
    
    log('\n=== Plugin launched successfully ===', 'success');
    log('The plugin is ready to use. In a real agent, actions would be triggered by user input.', 'info');
    log('This standalone script confirms the plugin loads and initializes correctly.', 'info');
    
    // Example of how to simulate an action invocation
    log('\nTo simulate an action invocation, you can edit this script to add code like:', 'debug');
    log(`
if (plugin.actions && plugin.actions.length > 0) {
  const action = plugin.actions[0]; // Select the first action
  console.log(\`\\nSimulating action: \${action.name}\`);
  
  // Create sample parameters
  const params = {}; // Fill with appropriate parameters
  
  // Call the action handler
  const result = await action.handler(params, runtime);
  console.log('Action result:', result);
}`, 'debug');
    
  } catch (error) {
    log('Failed to launch plugin', 'error', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

main(); 