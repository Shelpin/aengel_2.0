# @elizaos/plugin-aeternity

æeternity blockchain plugin for Eliza OS that provides essential services and actions for private key management, token operations, and Telegram tipping.

> **Current Status:** Phase 1 implementation is in progress. The plugin's core tipping functionality has been implemented but some features like pending tip processing are currently disabled. See [Pre-Production Environment](#pre-production-environment) section for testing instructions.

## Project Status: Pre-Alpha Development

This plugin is currently in pre-alpha development. Core wallet and tipping functionality has been implemented but certain features are still under development or temporarily disabled.

### Phase 1: Core Wallet & Tipping (In Progress)
- ✅ Private key management with encryption
- ✅ AE transfers
- ✅ Telegram tipping with address registration
- ✅ Group chat notifications
- ✅ Contribution analysis for automatic tip amounts
- ⏳ Pending tip processing (temporarily disabled)

### Phase 2: Token Management (Planned)
- AEX-9 token deployment
- Token transfers
- Balance management

### Phase 3: Advanced Features (Planned)
- Superhero DEX integration
- Price fetching
- Trading operations

## Known Limitations

Current implementation has the following limitations:

1. **Pending Tip Processing**: The feature to process pending tips when a user registers their address is currently disabled.
2. **Action Type System**: The plugin is being updated to match the latest Eliza OS action type system.
3. **Error Handling**: Error handling in certain parts of the code is still being refined.

## Pre-Production Environment

The plugin is available for pre-production testing. We've implemented:

1. **Mock Client Mode**: For development and testing without real blockchain transactions
2. **Testing Suite**: Comprehensive tests for all functionality
3. **Error Handling**: Graceful error handling for development and testing
4. **Environment Variables**: Configuration for different environments

To run the pre-production tests:

```bash
pnpm tsx pre-prod-test.ts
```

This will test all the core functionality in a simulated environment without making actual blockchain transactions.

## Production Deployment Requirements

To deploy this plugin in a production environment, the following steps are required:

1. **Secure Key Management**:
   - Implement proper private key encryption with strong salts
   - Consider using a Hardware Security Module (HSM) or Trusted Execution Environment (TEE)
   - Never store unencrypted keys in environment variables or config files

2. **Blockchain Integration**:
   - Configure connection to a reliable Aeternity node
   - Set up monitoring for node connectivity and blockchain health
   - Implement transaction receipt verification and confirmation monitoring

3. **Security Considerations**:
   - Implement rate limiting to prevent abuse
   - Add IP-based restrictions for sensitive operations
   - Set up logging and alerting for unusual activities
   - Consider multi-signature wallets for large transaction amounts

4. **Testing Process**:
   - Test transactions on testnet before mainnet deployment
   - Perform security audits of key handling code
   - Conduct penetration testing of the API endpoints

By completing these steps, the plugin will be ready for secure production deployment with real transactions on the Aeternity blockchain.

## Overview

The Aeternity plugin serves as a foundational component of Eliza OS, bridging Aeternity blockchain capabilities with the Eliza ecosystem. It provides crucial services for secure private key management, transaction operations, and Telegram tipping features enabling agents to reward valuable community contributions.

## Features

### Wallet Management

* **Private Key Encryption**: Secure private key storage using encryption
* **Key Generation**: Secure key pair generation with customizable security levels
* **Address Management**: Manage Aeternity addresses
* **Balance Tracking**: Monitor account balances

### Transaction Operations

* **AE Transfers**: Send and receive native AE tokens securely
* **Transaction Tracking**: Monitor transaction status and confirmations
* **Fee Estimation**: Calculate appropriate transaction fees

### Telegram Integration

* **User Tipping**: Send AE tokens to Telegram users
* **Address Registration**: Request and store Aeternity addresses from users via DM
* **Group Notifications**: Notify groups when tips are sent and addresses are registered
* **Transaction Records**: Track tipping history
* **Custom Messages**: Include personalized messages with tips

### Contribution Analysis

* **Automated Evaluation**: Analyze the description of a contribution to determine its value
* **Suggested Tip Amounts**: Get recommended tip amounts based on contribution level
* **Contribution Levels**: Support for minor, helpful, valuable, major, and exceptional contributions
* **Contribution Types**: Categorization of contributions (code, tutorial, Q&A, etc.)
* **Customizable Amounts**: Adjust tip amounts for each contribution level
* **Confidence Scoring**: Assess the reliability of contribution analysis
* **Automatic Tipping**: Determine tip amount automatically without specifying an explicit amount

## Installation

```bash
npm install @elizaos/plugin-aeternity
```

## Configuration

Configure the plugin by setting the following environment variables:

```typescript
const aeternityEnvSchema = {
  // Wallet secret key (encrypted or hashed)
  WALLET_SECRET_KEY: string (optional),
  
  // Public address
  AE_WALLET_ADDRESS: string (optional),
  
  // Salt for encryption/decryption
  WALLET_SECRET_SALT: string (optional),
  
  // Network node URL
  AETERNITY_NODE_URL: string (default: 'https://mainnet.aeternity.io'),
  
  // Compiler URL for smart contracts
  AETERNITY_COMPILER_URL: string (default: 'https://compiler.aeternity.io'),
  
  // Network ID
  AETERNITY_NETWORK_ID: string (default: 'ae_mainnet'),
  
  // Explorer API URL
  AETERNITY_EXPLORER_URL: string (default: 'https://explorer.aeternity.io/api'),
};
```

## Usage

### Basic Setup

```typescript
import { initializeRuntime } from 'elizaos';
import { aeternityPlugin } from '@elizaos/plugin-aeternity';

// Initialize the plugin
const runtime = await initializeRuntime({
  plugins: [aeternityPlugin],
});
```

### Key Management

Generate a new key pair:

```typescript
// Example usage
const result = await runtime.executeAction('GENERATE_KEY_PAIR', {
  password: 'securePassword123',
  securityLevel: 'high', // 'low', 'medium', 'high', or 'tee'
});

console.log('Public Key:', result.publicKey);
console.log('Encrypted Private Key:', result.encryptedPrivateKey);
```

### Transfer AE Tokens

Send AE tokens to another address:

```typescript
// Example usage
const result = await runtime.executeAction('TRANSFER_AE', {
  recipient: 'ak_recipientAddressHere',
  amount: '1.5', // Amount in AE
  options: {
    fee: '0.00002', // Optional custom fee
  },
});

console.log('Transaction Hash:', result.hash);
```

### Tip Telegram Users

Send AE tokens as tips to Telegram users:

```typescript
// Example usage - with direct wallet address
const result = await runtime.executeAction('TIP_TELEGRAM_USER', {
  recipient: 'ak_recipientAddressHere', // Recipient wallet address
  amount: '0.1', // Amount in AE
  message: 'Thanks for your helpful answer!', // Optional message
  chatId: 'your_group_chat_id', // Optional group chat ID for notifications
});

// With Telegram username
const result = await runtime.executeAction('TIP_TELEGRAM_USER', {
  recipient: '@telegramUsername', // Telegram username
  amount: '0.1', // Amount in AE
  message: 'Thanks for your helpful answer!', // Optional message
  chatId: 'your_group_chat_id', // Optional group chat ID for notifications
});
```

If the user hasn't registered an address yet:
1. The bot will send a DM to the user requesting their Aeternity address
2. The bot will send a message in the group chat notifying the user to check their DMs
3. The tip will be stored as "pending" (Note: pending tip processing is currently disabled)
4. When the user responds with their address, the bot will register the address

### Process Address Registration

When a user sends their Aeternity address, register it:

```typescript
// Example usage
const result = await runtime.executeAction('PROCESS_ADDRESS_REGISTRATION', {
  username: 'telegramUsername', // Without @ prefix
  address: 'ak_recipientAddressHere',
  chatId: 'your_group_chat_id', // Optional group chat ID for notifications
});

console.log('Registration successful:', result.success);
```

### Analyze Contributions

Analyze a contribution description to determine its level and recommended tip amount:

```typescript
// Example usage
const result = await runtime.executeAction('ANALYZE_CONTRIBUTION', {
  description: 'This detailed explanation about smart contract security was very helpful and saved me hours of debugging.',
  contributor: 'expert_user', // Optional
  type: 'TECHNICAL_EXPLANATION', // Optional
  context: 'In response to a question about contract vulnerabilities' // Optional
});

console.log('Contribution Level:', result.analysis.level);
console.log('Suggested Tip Amount:', result.suggestedTipAmount);
console.log('Confidence Score:', result.analysis.confidenceScore);
```

You can also use contribution descriptions when tipping, without specifying an amount:

```typescript
// Tip with auto-calculated amount based on contribution description
const result = await runtime.executeAction('TIP_TELEGRAM_USER', {
  recipient: '@expert_user',
  contributionDescription: 'Great explanation of how state channels work. The examples were very clear and helped me understand the concept completely.',
  message: 'Thank you for your detailed explanation!',
  chatId: 'your_group_chat_id' // Optional
});

console.log('Tip Amount:', result.tipAmount);
console.log('Contribution Level:', result.contributionLevel);
```

### Customize Tip Amounts

You can customize the tip amounts for each contribution level:

```typescript
// Get the contribution analyzer provider
const contributionAnalyzer = await runtime.getProvider('contributionAnalyzer');

// Set custom tip amounts
contributionAnalyzer.setTipAmounts({
  minor: '0.2',        // 0.2 AE for minor contributions
  helpful: '0.75',     // 0.75 AE for helpful contributions
  valuable: '2.0',     // 2.0 AE for valuable contributions
  major: '5.0',        // 5.0 AE for major contributions
  exceptional: '10.0'  // 10.0 AE for exceptional contributions
});
```

## Telegram Bot Integration

To use this plugin with a Telegram bot for tipping:

1. Use the ElizaOS Telegram client
2. Configure the bot to recognize tipping commands
3. The plugin automatically handles message processing for address registration
4. Call the TIP_TELEGRAM_USER action when appropriate, providing the group chat ID

Example character configuration:
```json
{
  "name": "AeTipBot",
  "capabilities": ["can_tip_users", "can_analyze_contributions"],
  "clients": ["telegram"],
  "actions": [
    {
      "name": "TIP_TELEGRAM_USER",
      "description": "Tip a user with AE tokens",
      "plugin": "aeternity"
    },
    {
      "name": "PROCESS_ADDRESS_REGISTRATION",
      "description": "Register an Aeternity address for a user",
      "plugin": "aeternity" 
    },
    {
      "name": "ANALYZE_CONTRIBUTION",
      "description": "Analyze a contribution to determine its value and appropriate tip amount",
      "plugin": "aeternity"
    }
  ]
}
```

## Development Notes

### TypeScript Errors

When developing the plugin, you may encounter these TypeScript errors:

1. **Missing elizaos Module**
   
   Error: `Cannot find module 'elizaos' or its corresponding type declarations`
   
   This error is expected during development as the 'elizaos' module is only available in the ElizaOS runtime environment. We've added mock type definitions in the `src/types` directory to help with development.

2. **ContributionAnalyzerService Constructor Parameters**
   
   Error: `Expected 1-2 arguments, but got 0`
   
   The ContributionAnalyzerService requires the ElizaOS runtime to be passed in. During development, this parameter is optional to allow for testing, but in the actual ElizaOS environment, it's required.

3. **Action Type Issues**

   Error: `Type 'Action' is not generic`

   The Action type in ElizaOS is being updated. The plugin currently implements a modified version in the index.ts file to handle this.

## Pre-production Testing

You can test the plugin in a pre-production environment using the provided test scripts:

```bash
# Install dependencies
pnpm install

# Run the Telegram tipping test script
pnpm tsx test-telegram-tip.ts
```

The test script simulates:
- Address registration for Telegram users
- Sending tips to registered users
- Handling unregistered users
- Using contribution-based tip amounts

Note: The test runs in mock mode, simulating blockchain transactions without requiring a real blockchain connection.

## Production Deployment

For deploying to a production environment, please refer to the [Production Guide](./PRODUCTION_GUIDE.md), which covers:

- Security considerations
- Environment configuration
- Deployment steps
- Production features and monitoring
- Backup and recovery procedures
- Troubleshooting common issues

## Provider Access

Access the wallet provider directly:

```typescript
// Get the wallet provider
const walletProvider = await runtime.getProvider('aeternityWallet');

// Get wallet address
const address = await walletProvider.getAddress();

// Get wallet balance
const balance = await walletProvider.getBalance();

console.log(`Address: ${address}, Balance: ${balance} AE`);
```

Access the user address service:

```typescript
// Get the user address service
const userAddressService = await runtime.getProvider('aeternityUserAddress');

// Get address for a Telegram user
const address = userAddressService.getAddress('telegramUsername');

// Store an address for a user
userAddressService.storeAddress('telegramUsername', 'ak_address');

// Check pending tips
const pendingTips = userAddressService.getPendingTips('telegramUsername');
```

## How Telegram Tipping Works

1. **User Makes Valuable Contribution** - Someone in your Telegram community shares helpful information
2. **Bot Sends Tip** - Your bot decides to tip this user with `TIP_TELEGRAM_USER` action
3. **Group Notification** - Bot announces in the group chat that the user has been tipped and should check their DMs
4. **Address Request** - The bot sends the user a DM requesting their Aeternity address
5. **User Registers Address** - User replies with their Aeternity address
6. **Address Confirmed** - Bot announces in the group that the user has registered their address
7. **Future Tips** - Next time the user is tipped, their address is already known and tip is processed directly

## Group Chat Notifications

The plugin sends the following notifications to group chats:

1. **When Tipping a User Without Address**:
   ```
   @username, someone wants to tip you with AE tokens! I've sent you a direct message - please check your DMs and reply with your Aeternity address to receive your tip.
   ```

2. **When a User Registers an Address**:
   ```
   @username has registered their Aeternity address and is now ready to receive tips! 🎉
   ```

3. **When Sending a Tip to a User with Registered Address**:
   ```
   Tip sent! @username has received 0.1 AE with message: "Thanks for your help!" (TX: ak_2tfrsj5...)
   ```

## Security Best Practices

1. **Private Key Storage**  
   * Always encrypt private keys when storing
   * Use environment variables or secure secret storage
   * Consider hardware wallets for production use

2. **Transaction Verification**  
   * Verify transaction parameters before signing
   * Implement confirmation steps for high-value transactions
   * Use simulation to preview transaction outcomes

3. **Network Configuration**  
   * Use secure, trusted RPC endpoints
   * Consider private nodes for production environments
   * Implement connection fallbacks

## Development Roadmap

### Current (Phase 1)
- ✅ Private key management
- ✅ AE transfers
- ✅ Telegram tipping interface
- ✅ Address registration via DM
- ⏳ Pending tip handling (temporarily disabled)
- ✅ Group chat notifications
- ✅ Contribution analysis and automatic tip amount determination

### Next (Phase 2) - Coming Soon
- ⏳ AEX-9 token deployment
- ⏳ Token transfers
- ⏳ Token balance management

### Future (Phase 3)
- 📅 Superhero DEX integration
- 📅 Price fetching
- 📅 Trading operations

## Troubleshooting

### Common Issues

1. **Connection Errors**

```
Error: Failed to connect to Aeternity node
```

* Verify network connectivity
* Check node URL configuration
* Ensure node is operational

2. **Transaction Failures**

```
Error: Transaction rejected
```

* Check account balance
* Verify recipient address format
* Ensure proper fee configuration

3. **Key Management Issues**

```
Error: Failed to decrypt private key
```

* Verify encryption password is correct
* Check salt configuration
* Ensure private key format is valid

4. **Telegram Integration Issues**

```
Error: Could not request address from @username
```

* Ensure Telegram client is properly configured
* Verify the user accepts DMs from bots
* Check if the username exists

5. **Action Type Errors**

```
TypeError: action.validate is not a function
```

* This is a known issue related to action type definitions
* The current fix is implemented in index.ts

## Development

For local development:

```bash
# Clone the repository
git clone https://github.com/your-username/plugin-aeternity.git

# Install dependencies
cd plugin-aeternity
npm install

# Build the plugin
npm run build

# Run tests
npm test
```

## Credits

This plugin integrates with and builds upon several key technologies:

* **Aeternity** - The core blockchain platform
* **aepp-sdk** - Official Aeternity JavaScript SDK
* **crypto-js** - Encryption library

Special thanks to:

* The Aeternity developer community
* The Eliza community for their contributions and feedback

For more information about Aeternity blockchain capabilities:

* [Aeternity Documentation](https://docs.aeternity.io/)
* [Aeternity GitHub Repository](https://github.com/aeternity)

## License

This plugin is part of the Eliza project. See the main project repository for license information.

## SDK Version Compatibility

This plugin is compatible with `@aeternity/aepp-sdk` version 13.2.2. Using other versions may require adjustments to the implementation, particularly in the wallet provider and transaction services.

The plugin has been updated to work with the changes in the Aeternity SDK, including:
- Using the new constructor pattern for `MemoryAccount`, `Node`, and `Universal`
- Implementing required account methods like `signTypedData` and `signDelegation` 
- Supporting the `sk_` prefix format for secret keys

## Dependencies and Compatibility

### Aeternity SDK Integration

This plugin is compatible with `@aeternity/aepp-sdk` version 13.2.2. Using other versions may require adjustments to the implementation, particularly in the wallet provider and transaction services.

When developing locally, you have two options:
1. Install the SDK from npm: `pnpm add @aeternity/aepp-sdk@13.2.2`
2. Clone and link the SDK repository:
   ```bash
   git clone https://github.com/aeternity/aepp-sdk-js.git
   cd aepp-sdk-js
   npm install
   npm run build
   cd /path/to/your/project
   mkdir -p node_modules/@aeternity
   ln -s /path/to/aepp-sdk-js node_modules/@aeternity/aepp-sdk
   ```

### TypeScript Support

The plugin includes TypeScript declarations for the Aeternity SDK, which may be missing in the SDK itself. These declarations are located in `src/types/aeternity-sdk.d.ts` and ensure proper type checking for the SDK functions.

### Mock Mode for Development

The plugin includes a mock mode for development that simulates Aeternity blockchain interactions without making actual transactions. This is useful for testing without requiring real tokens or network connectivity. 

In the `walletProvider.ts` file, we automatically fallback to mock mode if the SDK initialization fails, allowing development and testing to continue without requiring a proper SDK setup.

## License

ISC
