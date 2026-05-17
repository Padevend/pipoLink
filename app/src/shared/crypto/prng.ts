import nacl from 'tweetnacl';

import { installAppCrypto } from '@/shared/crypto/install-crypto';
import { secureRandomBytes } from '@/shared/crypto/secure-random';

let installed = false;

/**
 * tweetnacl exige un PRNG sécurisé.
 */
export function installTweetNaclPrng(): void {
  if (installed) return;
  installed = true;

  installAppCrypto();

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    nacl.setPRNG((x, n) => {
      const buf = new Uint8Array(n);
      globalThis.crypto.getRandomValues(buf);
      for (let i = 0; i < n; i++) x[i] = buf[i]!;
    });
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QuickCrypto = require('react-native-quick-crypto') as {
      getRandomValues?: (array: Uint8Array) => Uint8Array;
      randomBytes?: (size: number) => Buffer;
    };
    if (QuickCrypto.getRandomValues) {
      nacl.setPRNG((x, n) => {
        const buf = new Uint8Array(n);
        QuickCrypto.getRandomValues!(buf);
        for (let i = 0; i < n; i++) x[i] = buf[i]!;
      });
      return;
    }
    if (QuickCrypto.randomBytes) {
      nacl.setPRNG((x, n) => {
        const buf = QuickCrypto.randomBytes!(n);
        for (let i = 0; i < n; i++) x[i] = buf[i]!;
      });
      return;
    }
  } catch {
    // ignore
  }

  nacl.setPRNG((x, n) => {
    const buf = secureRandomBytes(n);
    for (let i = 0; i < n; i++) x[i] = buf[i]!;
  });
}
