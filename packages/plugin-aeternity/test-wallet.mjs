#!/usr/bin/env node
/**
 * Test script for validating mnemonic to wallet address conversion
 */

const mnemonic = 'useless rail whale crop shove crime only first race sort forget demand';
const hdIndex = 0;

async function testMnemonic() {
  console.log('Testing mnemonic to wallet address conversion');
  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`HD Index: ${hdIndex}`);
  
  try {
    // Use dynamic imports to handle different module formats
    const hdWalletPkg = await import('@aeternity/hd-wallet');
    const sdkPkg = await import('@aeternity/aepp-sdk');
    
    // Extract the functions we need
    const generateHDWallet = hdWalletPkg.default?.generateHDWallet || hdWalletPkg.generateHDWallet;
    const getHDWalletAccounts = hdWalletPkg.default?.getHDWalletAccounts || hdWalletPkg.getHDWalletAccounts;
    const MemoryAccount = sdkPkg.default?.MemoryAccount || sdkPkg.MemoryAccount;
    
    if (!generateHDWallet || !getHDWalletAccounts || !MemoryAccount) {
      console.error('Required functions not found in imported modules');
      console.log('HD wallet module exports:', Object.keys(hdWalletPkg));
      console.log('SDK module exports:', Object.keys(sdkPkg));
      return;
    }
    
    const hdWallet = await generateHDWallet(mnemonic);
    console.log('HD wallet generated successfully');
    
    const accounts = await getHDWalletAccounts(hdWallet, 1);
    console.log(`Derived account: ${JSON.stringify(accounts[0])}`);
    
    const secretKey = accounts[0].secretKey;
    console.log(`Secret key type: ${typeof secretKey}`);
    console.log(`Buffer.isBuffer: ${Buffer.isBuffer(secretKey)}`);
    
    try {
      // Convert buffer-like object to proper hex string
      let keypair = {
        publicKey: Buffer.from(Object.values(accounts[0].publicKey)),
        secretKey: Buffer.from(Object.values(accounts[0].secretKey))
      };
      
      console.log('Created keypair object with buffers');
      
      // Try with the raw keypair
      try {
        const accountWithKeypair = new MemoryAccount({ keypair });
        console.log(`Account address (with keypair): ${accountWithKeypair.address}`);
      } catch (keypairErr) {
        console.error('Failed with keypair approach:', keypairErr);
      }
      
      // Try with Uint8Array
      try {
        const keypairUint8 = {
          publicKey: new Uint8Array(Object.values(accounts[0].publicKey)),
          secretKey: new Uint8Array(Object.values(accounts[0].secretKey))
        };
        const accountWithUint8 = new MemoryAccount({ keypair: keypairUint8 });
        console.log(`Account address (with Uint8Array): ${accountWithUint8.address}`);
      } catch (uint8Err) {
        console.error('Failed with Uint8Array approach:', uint8Err);
      }
      
      // Try with prefix
      try {
        const secretKeyHex = Buffer.from(Object.values(accounts[0].secretKey)).toString('hex');
        const prefixedKey = `sk_${secretKeyHex}`;
        console.log(`Trying with prefixed key: ${prefixedKey.substring(0, 10)}...`);
        const accountWithPrefix = new MemoryAccount({ secretKey: prefixedKey });
        console.log(`Account address (with prefix): ${accountWithPrefix.address}`);
      } catch (prefixErr) {
        console.error('Failed with prefix approach:', prefixErr);
      }
    } catch (err) {
      console.error('Failed to create MemoryAccount:', err);
    }
  } catch (err) {
    console.error('Error during testing:', err);
  }
}

testMnemonic(); 