import { canUseQuickCrypto } from '@/shared/crypto/crypto-runtime';
import { installExpoCryptoGetRandomValues } from '@/shared/crypto/expo-random';

/**
 * Installe le polyfill crypto (quick-crypto en dev build, expo-crypto en Expo Go).
 * Doit être appelé avant tout chiffrement (entry _layout).
 */
let installed = false;

export function installAppCrypto(): void {
  if (installed) return;
  installed = true;

  if (!canUseQuickCrypto()) {
    installExpoCryptoGetRandomValues();
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QuickCrypto = require('react-native-quick-crypto') as {
      install?: () => void;
      getRandomValues?: (array: Uint8Array) => Uint8Array;
      subtle?: SubtleCrypto;
    };
    if (typeof QuickCrypto.install === 'function') {
      QuickCrypto.install();
    } else if (QuickCrypto.getRandomValues && !globalThis.crypto?.getRandomValues) {
      (globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
        ...(globalThis.crypto ?? {}),
        getRandomValues: QuickCrypto.getRandomValues,
        subtle:          QuickCrypto.subtle,
      } as Crypto;
    }
  } catch {
    installExpoCryptoGetRandomValues();
  }

  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    installExpoCryptoGetRandomValues();
  }
}
