/** Octets aléatoires sécurisés (quick-crypto / Web Crypto). */
export function secureRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const qc = require('react-native-quick-crypto') as { randomBytes: (n: number) => Buffer };
    return new Uint8Array(qc.randomBytes(length));
  } catch {
    throw new Error('Générateur aléatoire indisponible.');
  }
}
