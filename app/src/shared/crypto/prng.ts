import nacl from 'tweetnacl';

let installed = false;

/**
 * tweetnacl exige un PRNG sécurisé ; React Native n'expose pas `crypto.getRandomValues` par défaut.
 */
export function installTweetNaclPrng(): void {
  if (installed) return;
  installed = true;

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
    const ExpoCrypto = require('expo-crypto') as { getRandomBytes: (length: number) => Uint8Array };
    nacl.setPRNG((x, n) => {
      const buf = ExpoCrypto.getRandomBytes(n);
      const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      for (let i = 0; i < n; i++) x[i] = bytes[i]!;
    });
    return;
  } catch {
    // fallback: react-native-get-random-values polyfill
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-get-random-values');
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      nacl.setPRNG((x, n) => {
        const buf = new Uint8Array(n);
        globalThis.crypto.getRandomValues(buf);
        for (let i = 0; i < n; i++) x[i] = buf[i]!;
      });
      return;
    }
  } catch {
    // ignore
  }

  throw new Error(
    'PRNG indisponible. Installez expo-crypto ou react-native-get-random-values, puis redémarrez l’app.',
  );
}
