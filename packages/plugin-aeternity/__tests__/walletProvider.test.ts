import { AeternityWalletProvider } from '../src/providers/walletProvider';
import { WalletSecurityLevel } from '../src/types';

describe('AeternityWalletProvider', () => {
  describe('Key Pair Generation', () => {
    it('should generate a new key pair with encryption', async () => {
      const password = 'testPassword123';
      
      const result = await AeternityWalletProvider.generateKeyPair(password);
      
      expect(result).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(result.publicKey.startsWith('ak_')).toBeTruthy();
      expect(result.encryptedPrivateKey).toBeDefined();
    });
    
    it('should encrypt and decrypt private keys', () => {
      const privateKey = 'testPrivateKey123';
      const password = 'testPassword123';
      
      const encrypted = AeternityWalletProvider.encryptPrivateKey(privateKey, password);
      expect(encrypted).toBeDefined();
      
      const decrypted = AeternityWalletProvider.decryptPrivateKey(encrypted, password);
      expect(decrypted).toEqual(privateKey);
    });
  });
}); 