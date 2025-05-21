# Aeternity Plugin Production Guide

This guide walks through steps required to deploy the Aeternity plugin to a production ElizaOS environment.

## 1. Set up the ElizaOS Runtime

The plugin requires a real ElizaOS runtime for production use:

```javascript
// In your ElizaOS environment
const { ElizaRuntime } = require('elizaos');
const { aeternityPlugin } = require('plugin-aeternity');

// Initialize the runtime
const runtime = new ElizaRuntime();

// Register the Aeternity plugin
runtime.registerPlugin(aeternityPlugin);
```

## 2. SDK Compatibility

Fix SDK compatibility issues:

1. Install compatible SDK version:
```bash
pnpm add @aeternity/aepp-sdk@13.2.2
```

2. Ensure the key format matches SDK expectations:
```javascript
// Generate keys in correct format
const { AeSdk, MemoryAccount } = require('@aeternity/aepp-sdk');
const account = AeSdk.getAccountFromPrivateKey(privateKeyString);
```

## 3. Fund the Wallet

1. **For Testnet**: Use [faucet.aepps.com](https://faucet.aepps.com) to get tokens
2. **For Mainnet**: Transfer real AE tokens to your wallet address

Verify balance before deployment:
```bash
# Run the verification tool
node check-balance.js
```

## 4. Configure Telegram Integration

1. Set up Telegram bot with BotFather
2. Configure webhook for real-time chat updates
3. Update `.env` with production values:

```
# Production .env values
TELEGRAM_BOT_TOKEN=your_bot_token
AE_WALLET_ADDRESS=ak_real_production_address
WALLET_SECRET_KEY=encrypted_production_key
WALLET_SECRET_SALT=production_salt
AETERNITY_NODE_URL=https://mainnet.aeternity.io
AETERNITY_NETWORK_ID=ae_mainnet
```

## 5. Security Checks

Before deployment, verify:
- [x] Private key is properly encrypted
- [x] No hardcoded credentials in code
- [x] Error handling for network failures
- [x] Rate limiting for API calls
- [x] Secure storage for user addresses

## 6. Deployment

1. Build the production package:
```bash
pnpm build
```

2. Deploy to ElizaOS:
```bash
elizaos deploy plugin-aeternity
```

3. Verify operation:
```bash
elizaos logs plugin-aeternity
```

## 7. Monitoring

Set up monitoring to track:
- Transaction success/failure rates
- Wallet balance levels
- User registrations
- API rate limits

## Troubleshooting

If you encounter SDK compatibility issues:
1. Check the Node initialization format
2. Verify key format matches SDK expectations
3. Consult the SDK documentation at [aeternity.com/documentation](https://aeternity.com/documentation)

## Prerequisites

- ElizaOS runtime environment (version 0.25.0 or higher)
- Access to a secure key storage system
- Aeternity node credentials (for mainnet or testnet)

## Security Considerations

### Private Key Management

In production, **never** store private keys directly in environment variables or config files. Instead:

1. Use a secure key management system (KMS)
2. Implement proper encryption for any stored keys
3. Consider using a hardware security module (HSM) for critical operations

### Environment Configuration

Create a separate `.env` file for production with secure settings:

```
# PRODUCTION ENVIRONMENT

# Use a secure method for key storage, not directly in this file
# WALLET_SECRET_KEY should be securely managed, not in plain text
# WALLET_SECRET_SALT should be a strong random value

# Network configuration for mainnet
AETERNITY_NODE_URL=https://mainnet.aeternity.io
AETERNITY_COMPILER_URL=https://compiler.aeternity.io
AETERNITY_NETWORK_ID=ae_mainnet
AETERNITY_EXPLORER_URL=https://explorer.aeternity.io/api

# Set this to false in production
AE_PLUGIN_DEVELOPMENT_MODE=false
```

## Production Features

### Telegram Bot Integration

For production Telegram integration:

1. Use a dedicated bot token
2. Set proper webhook URLs
3. Implement rate limiting
4. Add monitoring for failed transactions
5. Configure error notifications

### Transaction Monitoring

Set up a monitoring system to:

- Track successful/failed transactions
- Monitor pending tips
- Detect and handle network issues
- Alert on any security anomalies

### Backup and Recovery

Implement regular backups of:

- User address mappings
- Transaction history
- Configuration settings

## Automatic Tipping Configuration

The Aeternity plugin now features automatic tipping for users when the agent responds to their messages. This feature enhances community engagement by rewarding valuable contributions.

### How It Works

1. When a user sends a message that the agent's LLM deems worthy of a response
2. After sending the response, the agent automatically tips the user
3. The tip amount is determined by analyzing the contribution's value
4. The user is notified in the group chat and via DM

### Configuration Options

You can customize the automatic tipping behavior in production:

```javascript
// In your configuration file
const tippingConfig = {
  // Enable/disable automatic tipping
  enabled: true,
  
  // Set minimum quality threshold (0-1) for tips
  minimumQualityThreshold: 0.7,
  
  // Configure tip amounts by contribution level
  tipAmounts: {
    minor: '0.1',
    helpful: '0.5',
    valuable: '1.0',
    major: '2.0',
    exceptional: '5.0'
  },
  
  // Set maximum daily/weekly tipping limits
  limits: {
    perUserDaily: '5.0',    // Maximum AE per user per day
    totalDaily: '50.0',     // Maximum total AE per day
    perUserWeekly: '10.0',  // Maximum AE per user per week
    totalWeekly: '100.0'    // Maximum total AE per week
  }
}

// Apply configuration
const contributionAnalyzer = await runtime.getProvider('contributionAnalyzer');
contributionAnalyzer.setTipAmounts(tippingConfig.tipAmounts);
```

### Future Enhancements (Phase 2)

In the next phase, the automatic tipping system will become more sophisticated:
- More nuanced analysis of contribution quality
- Selective tipping (agent may respond without tipping for basic responses)
- Learning from community feedback about tip appropriateness
- Budgeting controls to prevent excessive tipping

## Testing in Production-Like Environment

Before deploying to production:

1. Test on testnet with real transactions
2. Simulate high load scenarios
3. Test recovery procedures
4. Verify security measures

## Updating the Plugin

When updating the plugin in production:

1. Test updates thoroughly on testnet
2. Use semantic versioning
3. Implement a rollback strategy
4. Schedule updates during low-usage periods

## Monitoring and Maintenance

1. Set up logging to capture:
   - Transaction events
   - Error conditions
   - Security-related events

2. Implement health checks:
   - Node connectivity
   - API availability
   - System resource usage

3. Regular maintenance:
   - Update dependencies
   - Review security patches
   - Optimize performance

## Support and Resources

- Report issues: [GitHub Issues](https://github.com/your-org/plugin-aeternity/issues)
- Aeternity Node Documentation: [Aeternity Docs](https://docs.aeternity.io/)
- ElizaOS Plugin API: [ElizaOS Docs](https://docs.elizaos.com/) 