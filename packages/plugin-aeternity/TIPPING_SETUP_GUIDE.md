# Aeternity Tipping Functionality Setup Guide

This guide explains how to set up and integrate the Aeternity tipping functionality into your ElizaOS agent.

## Prerequisites

1. A properly built Aeternity plugin
2. Environment variables configured correctly
3. Integration with a Telegram bot (if using Telegram tipping)

## Environment Variables Setup

Add these to your `.env` file:

```
# Aeternity Node Configuration
AETERNITY_NODE_URL=https://testnet.aeternity.io
AETERNITY_COMPILER_URL=https://compiler.aeternity.io
AETERNITY_NETWORK_ID=ae_testnet

# Wallet Configuration - Option 1: Mnemonic
AETERNITY_SECRET_KEY=your mnemonic phrase here
AE_WALLET_HD_INDEX=0

# Wallet Configuration - Option 2: Direct Private Key
# AE_WALLET_SECRET_KEY=your_private_key_here

# Agent Wallet Address (for verification)
AE_WALLET_ADDRESS=ak_your_wallet_address_here
```

## Testing the Configuration

Before integrating with your agent, verify that your wallet configuration works correctly:

```bash
cd /root/eliza/packages/plugin-aeternity
node test-aeternity-wallet.js
```

This script verifies:
- Environment variables are set correctly
- HD wallet derivation works (if using mnemonic)
- The derived address matches your expected address
- Connection to the Aeternity node works

## Understanding the Tipping Flow

The Aeternity plugin provides three main actions:

1. `TIP_TELEGRAM_USER`: Sends a tip to a Telegram user
2. `PROCESS_ADDRESS_REGISTRATION`: Registers a user's Aeternity address and processes pending tips
3. `CATCH_ADDRESS_INPUT`: Stores a user's address when they respond to the DM

### Tipping Flow Steps:

1. Agent analyzes a message and decides to tip the user
2. `TIP_TELEGRAM_USER` action is triggered
3. If the user has a registered address, the tip is sent immediately
4. If not, the agent sends a DM asking for the user's address
5. The user responds with their address (must start with `ak_`)
6. `CATCH_ADDRESS_INPUT` action processes this response
7. The address is registered and pending tips are processed

## Integration Methods

### Method 1: Using with Full Agent

1. Ensure the plugin is properly built:
   ```bash
   cd /root/eliza
   ./faster-build.sh
   ```

2. Ensure imports are fixed:
   ```bash
   ./fix-agent-imports.sh
   ```

3. Modify your character configuration to include the plugin:
   ```json
   {
     "name": "Your Character",
     "plugins": ["plugin-aeternity"],
     "clients": ["TELEGRAM"],
     "modelProvider": "OPENAI"
   }
   ```

4. Start the agent with the character:
   ```bash
   pnpm start --character=path-to-your-character.json
   ```

### Method 2: Standalone Mode for Testing

The Aeternity plugin can also be tested in standalone mode:

```bash
cd /root/eliza/packages/plugin-aeternity
node test-aeternity-tipping.js
```

This script demonstrates:
- Registering a user's address
- Tipping a user with automatic amount calculation
- Tipping a user with a specific amount
- Processing an address input from a user

## Tipping Configuration

### Tip Amounts

The default tip amounts are configured in `ContributionAnalyzerService`:

- Minor contributions: 0.1 AE
- Helpful contributions: 0.5 AE
- Valuable contributions: 1.0 AE
- Major contributions: 2.5 AE
- Exceptional contributions: 5.0 AE

You can customize these by modifying `src/services/ContributionAnalyzerService.ts`.

### Automatic Tipping

The agent can automatically determine tip amounts based on contribution quality:

```javascript
// Example of auto-tip
await executeAction('TIP_TELEGRAM_USER', {
  recipient: 'username',
  contributionDescription: 'Provided an excellent explanation of Aeternity state channels',
  chatId: 'your_telegram_chat_id'
});
```

### Manual Tipping

To tip with a specific amount:

```javascript
// Example of specific amount tip
await executeAction('TIP_TELEGRAM_USER', {
  recipient: 'username',
  amount: '1.5',
  message: 'Thanks for the help!',
  chatId: 'your_telegram_chat_id'
});
```

## Troubleshooting

### Common Issues

1. **Address Registration Failing**:
   - Check that your DB service is properly initialized
   - Verify that the user's response starts with `ak_`

2. **Tipping Not Working**:
   - Ensure sufficient balance in the agent's wallet
   - Verify the recipient's address is properly registered
   - Check network connectivity to the Aeternity node

3. **Plugin Not Loading**:
   - Ensure the plugin is properly built
   - Verify the symlink from `node_modules` to the plugin
   - Check for circular dependencies

### Debugging

For detailed debugging, modify `src/services/AeternityWalletService.ts` to add more logging:

```typescript
// Add more logging around key transactions
await this.account.signTransaction(transaction, {
  onAccount: (data) => elizaLogger.debug('[AE_TX] onAccount data:', data),
  onSign: (data) => elizaLogger.debug('[AE_TX] onSign data:', data),
  onTx: (data) => elizaLogger.debug('[AE_TX] onTx data:', data),
});
```

## User Instructions

Share the `AUTOMATIC_TIPPING.md` document with your users to explain how the tipping system works from their perspective.

## Best Practices

1. **Security**: Never hardcode private keys or mnemonics
2. **Testing**: Test on testnet before moving to mainnet
3. **UX**: Provide clear instructions to users on how to register their address
4. **Monitoring**: Keep an eye on your agent's AE balance
5. **Backup**: Regularly backup user address mappings

## Commands Reference

```bash
# Build the plugin
cd /root/eliza/packages/plugin-aeternity && pnpm build

# Test wallet setup
node test-aeternity-wallet.js

# Test tipping functionality
node test-aeternity-tipping.js

# Launch standalone plugin
node launch-standalone.mjs
``` 