/** PRNG Expo Go (expo-crypto) — pas de module natif quick-crypto. */
export function expoGetRandomBytes(length: number): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Crypto = require('expo-crypto') as {
    getRandomBytes: (byteCount: number) => Uint8Array;
    getRandomValues?: <T extends ArrayBufferView>(typedArray: T) => T;
  };

  if (typeof Crypto.getRandomBytes === 'function') {
    return Crypto.getRandomBytes(length);
  }

  const buf = new Uint8Array(length);
  if (typeof Crypto.getRandomValues === 'function') {
    Crypto.getRandomValues(buf);
    return buf;
  }

  throw new Error('expo-crypto: générateur aléatoire indisponible.');
}

export function installExpoCryptoGetRandomValues(): void {
  if (typeof globalThis.crypto?.getRandomValues === 'function') return;

  const getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const bytes = expoGetRandomBytes(array.byteLength);
    new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes);
    return array;
  };

  (globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
    ...(globalThis.crypto ?? {}),
    getRandomValues,
  } as Crypto;
}
