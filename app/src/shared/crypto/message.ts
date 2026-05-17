import naclUtil from 'tweetnacl-util';

import { aesGcmDecrypt, aesGcmEncrypt, isAesGcmAvailable } from '@/shared/crypto/aes-gcm';
import { CRYPTO_GCM_STRICT } from '@/shared/crypto/policy';

function assertGcmAvailable(): void {
  if (CRYPTO_GCM_STRICT && !isAesGcmAvailable()) {
    throw new Error('AES-256-GCM requis sur cet appareil.');
  }
}

function isLikelyGcmIv(ivB64: string): boolean {
  try {
    return naclUtil.decodeBase64(ivB64).length === 12;
  } catch {
    return false;
  }
}

/** Chiffrement E2E AES-256-GCM (agent.md §3). */
export async function encryptMessage(
  plaintext: string,
  chatKey: Uint8Array,
): Promise<{ cipherText: string; iv: string }> {
  assertGcmAvailable();
  return aesGcmEncrypt(plaintext, chatKey);
}

/** Déchiffre AES-256-GCM (IV 12 octets). */
export async function decryptMessage(
  cipherText: string,
  iv: string,
  chatKey: Uint8Array,
): Promise<string | null> {
  if (!isLikelyGcmIv(iv)) return null;
  if (!isAesGcmAvailable()) return null;
  return aesGcmDecrypt(cipherText, iv, chatKey);
}
