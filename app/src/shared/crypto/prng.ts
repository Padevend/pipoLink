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

  nacl.setPRNG((x, n) => {
    const buf = secureRandomBytes(n);
    for (let i = 0; i < n; i++) x[i] = buf[i]!;
  });
}
