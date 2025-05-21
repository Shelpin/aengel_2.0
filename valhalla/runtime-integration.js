/**
 * Valhalla Runtime Integration Module
 * 
 * This module extends the ElizaOS runtime with required functionality for the
 * multi-agent Telegram system. Instead of patches, it properly integrates with
 * ElizaOS's core architecture.
 */

import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

// Runtime configurations
const DEFAULT_HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONFIG = {
  version: '1.0.0',
  heartbeatEndpoints: ['/health', '/heartbeat'],
  fallbackResponses: {
    helpful: "I'd like to respond in more detail, but I'm currently in limited mode. I'll get back to you soon!",
    technical: "Due to a temporary processing constraint, I'm unable to generate a complete response at this time.",
    friendly: "Hey there! I got your message but I'm a bit tied up at the moment. I'll jump back in soon!",
    default: "I received your message but I'm currently in limited mode. Please try again later."
  }
};

/**
 * Initialize the ElizaOS runtime with Valhalla requirements
 * @param {Object} runtime - The ElizaOS runtime object
 * @param {Object} options - Configuration options
 * @returns {Object} - Enhanced runtime
 */
export async function initializeRuntime(runtime, options = {}) {
  const logger = options.logger || console;
  
  logger.info('[VALHALLA] Initializing ElizaOS runtime integration');
  
  // Store the runtime in global scope for plugins to access
  globalThis.__elizaRuntime = runtime;
  
  // Add handleMessage method if not present
  if (runtime && typeof runtime.handleMessage !== 'function') {
    logger.info('[VALHALLA] Extending runtime with handleMessage capability');
    
    runtime.handleMessage = async (message) => {
      logger.info(`[VALHALLA] Processing message: "${message.text?.substring(0, 50)}..."`);
      
      try {
        // Try different approaches to handle the message
        if (runtime.conversationManager?.generateResponse) {
          logger.info('[VALHALLA] Using conversationManager.generateResponse');
          return await runtime.conversationManager.generateResponse(message);
        }
        
        if (runtime.clients?.length > 0) {
          // Try to find a telegram client
          const telegramClient = runtime.clients.find(client => 
            client.type === 'telegram' || client.telegram
          );
          
          if (telegramClient?.handleMessage) {
            logger.info('[VALHALLA] Using telegramClient.handleMessage');
            return await telegramClient.handleMessage(message);
          }
        }
        
        // Generate a fallback response based on character traits
        return generateFallbackResponse(runtime, message);
      } catch (error) {
        logger.error(`[VALHALLA] Error in runtime.handleMessage: ${error.message}`);
        return {
          text: "I'm having trouble processing messages right now. Please try again later.",
          content: { action: 'SAY' }
        };
      }
    };
    
    logger.info('[VALHALLA] Runtime handleMessage successfully integrated');
  } else {
    logger.info('[VALHALLA] Runtime handleMessage already exists, using existing implementation');
  }
  
  return runtime;
}

/**
 * Initialize the heartbeat mechanism for relay registration
 * @param {Object} options - Configuration options
 * @returns {Object} - Server and interval references for cleanup
 */
export function initializeHeartbeat(options = {}) {
  const port = options.port || process.env.HTTP_PORT || process.env.PORT || 3000;
  const agentId = options.agentId || process.env.AGENT_ID;
  const interval = options.interval || DEFAULT_HEARTBEAT_INTERVAL;
  const logger = options.logger || console;
  const relayUrl = options.relayUrl || process.env.RELAY_SERVER_URL || 'http://207.180.245.243:4000';
  const authToken = options.authToken || process.env.RELAY_AUTH_TOKEN || 'elizaos-secure-relay-key';
  
  if (!agentId) {
    logger.error('[VALHALLA] No agent ID provided for heartbeat');
    return null;
  }
  
  logger.info(`[VALHALLA] Initializing heartbeat for ${agentId} on port ${port}`);
  
  // Create a simple HTTP server for health checks
  const server = http.createServer((req, res) => {
    if (CONFIG.heartbeatEndpoints.includes(req.url)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        agent_id: agentId,
        timestamp: Date.now(),
        version: CONFIG.version
      }));
      return;
    }
    
    // Default response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
  
  // Start the server
  try {
    server.listen(port, () => {
      logger.info(`[VALHALLA] Heartbeat server listening on port ${port}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`[VALHALLA] Port ${port} is already in use - will use existing server`);
      } else {
        logger.error(`[VALHALLA] Server error: ${err.message}`);
      }
    });
  } catch (error) {
    logger.error(`[VALHALLA] Failed to start heartbeat server: ${error.message}`);
  }
  
  // Create heartbeat sender function
  const sendHeartbeat = async () => {
    try {
      const response = await fetch(`${relayUrl}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ agent_id: agentId })
      });
      
      if (response.ok) {
        logger.info(`[VALHALLA] Heartbeat successful for ${agentId}`);
      } else {
        logger.warn(`[VALHALLA] Heartbeat failed: ${response.status} ${response.statusText}`);
        
        // Auto-register if needed
        if (response.status === 404 || response.status === 400) {
          logger.info(`[VALHALLA] Agent not registered, attempting registration`);
          
          const registerResponse = await fetch(`${relayUrl}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              agent_id: agentId,
              token: authToken
            })
          });
          
          if (registerResponse.ok) {
            logger.info(`[VALHALLA] Registration successful for ${agentId}`);
          } else {
            logger.error(`[VALHALLA] Registration failed: ${registerResponse.status}`);
          }
        }
      }
    } catch (error) {
      logger.error(`[VALHALLA] Error sending heartbeat: ${error.message}`);
    }
  };
  
  // Send immediate heartbeat
  sendHeartbeat();
  
  // Schedule regular heartbeats
  const heartbeatInterval = setInterval(sendHeartbeat, interval);
  
  // Return references for cleanup
  return {
    server,
    interval: heartbeatInterval,
    stop: () => {
      clearInterval(heartbeatInterval);
      server.close();
    }
  };
}

/**
 * Generate a fallback response when the runtime fails to provide one
 * @param {Object} runtime - The ElizaOS runtime
 * @param {Object} message - The message object
 * @returns {Object} - Response object with text
 */
function generateFallbackResponse(runtime, message) {
  let responseText = CONFIG.fallbackResponses.default;
  
  try {
    // Try to personalize based on character traits
    if (runtime?.character?.traits) {
      const traits = runtime.character.traits;
      
      if (traits.includes('helpful')) {
        responseText = CONFIG.fallbackResponses.helpful;
      } else if (traits.includes('technical')) {
        responseText = CONFIG.fallbackResponses.technical;
      } else if (traits.includes('friendly')) {
        responseText = CONFIG.fallbackResponses.friendly;
      }
    }
  } catch (error) {
    // Fall back to default response on error
  }
  
  return {
    text: responseText,
    content: { action: 'SAY' }
  };
}

/**
 * Normalize agent ID for consistent identification
 * @param {string} agentId - Raw agent ID
 * @returns {string} - Normalized agent ID
 */
export function normalizeAgentId(agentId) {
  if (!agentId) return '';
  
  // Standard format: lowercase with _bot suffix
  const normalized = agentId.toLowerCase();
  return normalized.endsWith('_bot') ? normalized : `${normalized}_bot`;
}

export default {
  initializeRuntime,
  initializeHeartbeat,
  normalizeAgentId,
  CONFIG
}; 