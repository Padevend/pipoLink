import { canUseQuickCrypto } from './crypto-runtime';

/**
 * Derives a 256-bit key from a password and salt using PBKDF2-HMAC-SHA256.
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const iterations = 10000;
  const keyLen = 32; // 32 bytes = 256 bits

  if (canUseQuickCrypto()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const qc = require('react-native-quick-crypto') as {
        pbkdf2Sync: (
          password: string | Buffer,
          salt: string | Buffer | Uint8Array,
          iterations: number,
          keylen: number,
          digest: string
        ) => Buffer;
      };
      const keyBuffer = qc.pbkdf2Sync(password, salt, iterations, keyLen, 'sha256');
      return new Uint8Array(keyBuffer);
    } catch (err) {
      console.warn('[deriveKeyFromPassword] QuickCrypto PBKDF2 failed, trying Web Crypto fallback:', err);
    }
  }

  // Fallback to Web Crypto Subtle
  const subtle = globalThis.crypto?.subtle;
  if (subtle && typeof subtle.importKey === 'function' && typeof subtle.deriveBits === 'function') {
    try {
      const enc = new TextEncoder();
      const baseKey = await subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBuffer = await subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt as any,
          iterations: iterations,
          hash: 'SHA-256',
        },
        baseKey,
        keyLen * 8
      );

      return new Uint8Array(derivedBuffer);
    } catch (err) {
      console.warn('[deriveKeyFromPassword] Web Crypto PBKDF2 failed, trying pure JS fallback:', err);
    }
  }

  // Final fallback: pure JS implementation via @noble/hashes (very fast, works in Expo Go)
  try {
    const { pbkdf2Async } = await import('@noble/hashes/pbkdf2.js');
    const { sha256 } = await import('@noble/hashes/sha2.js');
    const { utf8ToBytes } = await import('@noble/hashes/utils.js');

    const passBytes = typeof password === 'string' ? utf8ToBytes(password) : password;
    const derived = await pbkdf2Async(sha256, passBytes, salt, { c: iterations, dkLen: keyLen });
    return new Uint8Array(derived);
  } catch (err) {
    console.error('[deriveKeyFromPassword] Noble hashes fallback failed:', err);
  }

  throw new Error('No crypto provider available for PBKDF2 key derivation. All fallbacks failed.');
}
