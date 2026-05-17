import { canUseQuickCrypto } from '@/shared/crypto/crypto-runtime';
import { expoGetRandomBytes } from '@/shared/crypto/expo-random';

/** Octets aléatoires sécurisés (Web Crypto, quick-crypto ou expo-crypto). */
export function secureRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }

  if (canUseQuickCrypto()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const qc = require('react-native-quick-crypto') as { randomBytes: (n: number) => Buffer };
      return new Uint8Array(qc.randomBytes(length));
    } catch {
      // dev build sans module lié
    }
  }

  return expoGetRandomBytes(length);
}
