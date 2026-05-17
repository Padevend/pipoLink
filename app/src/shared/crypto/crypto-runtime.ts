/**
 * Détection d'environnement : quick-crypto nécessite un binaire natif (dev build),
 * absent dans Expo Go (erreur TurboModule QuickBase64).
 */
export function isExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as { appOwnership?: string };
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

/** Ne jamais require('react-native-quick-crypto') quand false. */
export function canUseQuickCrypto(): boolean {
  return !isExpoGo();
}
