/**
 * Debug Aeternity SDK keypair handling
 */

const { MemoryAccount, Node, Universal } = require('@aeternity/aepp-sdk');

(async () => {
  try {
    // 1. Generate a new account
    console.log('1. Generating a new memory account...');
    const account = MemoryAccount.generate();
    console.log(`  Secret key: ${account.secretKey}`);
    console.log(`  Public key: ${account.address}`);
    
    // 2. Try to create an account from the generated secret key
    console.log('\n2. Creating a memory account from the generated secret key...');
    try {
      const reusedAccount = new MemoryAccount({ secretKey: account.secretKey });
      console.log(`  Success! Address: ${reusedAccount.address}`);
    } catch (error) {
      console.error(`  Error creating account from secret key: ${error.message}`);
    }
    
    // 3. Try to actually use this account with the SDK
    console.log('\n3. Trying to use this account with the Aeternity SDK...');
    try {
      // Initialize node
      const node = new Node({
        url: 'https://testnet.aeternity.io',
        internalUrl: 'https://testnet.aeternity.io',
      });
      
      // Create SDK client with the account
      const client = new Universal({
        nodes: [{ name: 'node', instance: node }],
        accounts: [account],
        compilerUrl: 'https://compiler.aeternity.io',
        networkId: 'ae_uat',
      });
      
      // Try to get account balance to verify it works
      const address = await client.address();
      console.log(`  Success! Client initialized with address: ${address}`);
      
      // Try to print client version and capabilities
      console.log(`  SDK capabilities:`, Object.keys(client));
    } catch (error) {
      console.error(`  Error using account with SDK: ${error.message}`);
    }
    
    // 4. Print the exact object structure of the memory account
    console.log('\n4. Memory account object structure:');
    console.log(JSON.stringify(account, null, 2).replace(account.secretKey, '[REDACTED]'));
    
  } catch (error) {
    console.error('General error:', error);
  }
})(); 