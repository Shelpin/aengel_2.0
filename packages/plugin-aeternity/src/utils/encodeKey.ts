// Utility for encoding Aeternity private keys
import bs58check from 'bs58check';
import { Buffer } from 'buffer'; // Ensure Buffer is available

// Correct Aeternity prefix for 'sk_' (secret key)
// Decimal: [76, 171], Hex: [0x4C, 0xAB]
const SK_PREFIX_BYTES = Buffer.from([76, 171]);

/**
 * Encodes a raw private key buffer into the Aeternity base58check format with 'sk' prefix.
 * @param privateKey The raw private key Buffer (expected to be 32 or 64 bytes).
 * @returns The base58check encoded private key string, prefixed with 'sk_'.
 * @throws Error if the input is not a Buffer.
 */
export function encodePrivateKey(privateKeyBuffer: Buffer): string {
  if (!Buffer.isBuffer(privateKeyBuffer) || privateKeyBuffer.length !== 32) {
    throw new Error('Private key buffer must be a 32-byte Buffer.');
  }
  // Concatenate the correct prefix with the private key data
  const payloadWithPrefix = Buffer.concat([SK_PREFIX_BYTES, privateKeyBuffer]);
  // Encode using bs58check
  const base58Encoded = bs58check.encode(payloadWithPrefix);
  return `sk_${base58Encoded}`;
}

// Note: A similar function would be needed for public keys ('ak_') if deriving them locally,
// likely using a different prefix byte (e.g., 38 based on common patterns). 