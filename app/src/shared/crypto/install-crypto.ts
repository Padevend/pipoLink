/**
 * Installe le polyfill crypto (quick-crypto en dev build, sinon PRNG via @noble/ciphers).
 * Doit être appelé avant tout chiffrement (entry _layout).
 */
let installed = false;

export function installAppCrypto(): void {
  if (installed) return;
  installed = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QuickCrypto = require('react-native-quick-crypto') as {
      install?: () => void;
      getRandomValues?: (array: Uint8Array) => Uint8Array;
    };
    if (typeof QuickCrypto.install === 'function') {
      QuickCrypto.install();
    } else if (QuickCrypto.getRandomValues && !globalThis.crypto?.getRandomValues) {
      (globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
        ...(globalThis.crypto ?? {}),
        getRandomValues: QuickCrypto.getRandomValues,
        subtle: (QuickCrypto as unknown as { subtle?: SubtleCrypto }).subtle,
      } as Crypto;
    }
  } catch {
    // Expo Go : module natif absent — AES-GCM via @noble/ciphers dans aes-gcm.ts
  }
}
