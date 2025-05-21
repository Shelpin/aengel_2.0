import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import fs from 'fs';

// Set up dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Mock the ElizaOS logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
  warn: (...args: any[]) => console.log('[WARN]', ...args)
};

// Simple runtime class
class SimpleRuntime {
  agentId = 'test-agent';
  plugins: any[] = [];
  services: Record<string, any> = {};
  clients: Record<string, any> = {};
  logger = logger;
  
  registerService(service: any) {
    const name = service.constructor?.serviceType || 'unknown';
    logger.info(`Registered service: ${name}`);
    this.services[name] = service;
    return service;
  }
  
  registerClient(client: any) {
    const name = client.constructor?.name || 'unknown';
    logger.info(`Registered client: ${name}`);
    this.clients[name] = client;
    return client;
  }
}

async function loadPlugin(pluginPath: string) {
  try {
    logger.info(`Loading plugin from ${pluginPath}`);
    
    // Check if file exists
    if (!fs.existsSync(pluginPath)) {
      logger.error(`Plugin file not found at ${pluginPath}`);
      return null;
    }
    
    // Try to import the plugin
    const moduleUrl = pathToFileURL(pluginPath).href;
    logger.info(`Importing module from ${moduleUrl}`);
    const pluginModule = await import(moduleUrl);
    
    // Get the plugin object
    const plugin = pluginModule.default || pluginModule;
    if (!plugin) {
      logger.error('No plugin exported from the module');
      return null;
    }
    
    logger.info(`Successfully loaded plugin: ${plugin.name}`);
    return plugin;
  } catch (error) {
    logger.error(`Error loading plugin: ${(error as Error).message}`);
    logger.error((error as Error).stack);
    return null;
  }
}

async function main() {
  console.log('=======================================');
  console.log('Simple Aeternity Plugin Test');
  console.log('=======================================\n');
  
  // Set up environment variables if needed
  if (!process.env.AETERNITY_NODE_URL) {
    console.log('Setting up Aeternity environment variables...');
    process.env.AETERNITY_NODE_URL = 'https://testnet.aeternity.io';
    process.env.AETERNITY_COMPILER_URL = 'https://compiler.aeternity.io';
    process.env.AETERNITY_SECRET_KEY = 'useless rail whale crop shove crime only first race sort forget demand';
    process.env.AE_WALLET_ADDRESS = 'ak_26nkCJvJK5vxL6Gx3Sgij5SQ3huzwJg9WJ27MbZihgzFugy6AC';
    process.env.AE_WALLET_HD_INDEX = '0';
  }
  
  // Create runtime
  const runtime = new SimpleRuntime();
  
  // Load Aeternity plugin
  const aeternityPluginPath = path.resolve(__dirname, 'dist/index.js');
  const aeternityPlugin = await loadPlugin(aeternityPluginPath);
  
  if (!aeternityPlugin) {
    console.error('Failed to load Aeternity plugin. Exiting.');
    process.exit(1);
  }
  
  // Initialize the plugin (if it has an initialize method)
  if (typeof aeternityPlugin.initialize === 'function') {
    console.log('Initializing Aeternity plugin...');
    await aeternityPlugin.initialize(runtime);
    console.log('Plugin initialized!');
  } else {
    console.log('Plugin does not have an initialize method');
  }
  
  // Display plugin info
  console.log('\nPlugin Information:');
  console.log(`Name: ${aeternityPlugin.name}`);
  console.log(`Description: ${aeternityPlugin.description}`);
  
  // Check for actions
  if (aeternityPlugin.actions && aeternityPlugin.actions.length > 0) {
    console.log('\nAvailable Actions:');
    aeternityPlugin.actions.forEach((action: any, index: number) => {
      console.log(`${index + 1}. ${action.name}: ${action.description}`);
    });
  } else {
    console.log('\nNo actions found in plugin');
  }
  
  // Check services
  console.log('\nRegistered Services:');
  const serviceKeys = Object.keys(runtime.services);
  if (serviceKeys.length > 0) {
    serviceKeys.forEach(key => {
      console.log(`- ${key}`);
    });
  } else {
    console.log('No services registered');
  }
  
  console.log('\nTest completed successfully!');
}

// Run the test
main().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1); 