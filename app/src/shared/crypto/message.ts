import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { aesGcmDecrypt, aesGcmEncrypt, isAesGcmAvailable } from '@/shared/crypto/aes-gcm';

function isLikelyGcmIv(ivB64: string): boolean {
  try {
    return naclUtil.decodeBase64(ivB64).length === 12;
  } catch {
    return false;
  }
}

/** Chiffrement E2E : AES-256-GCM si disponible, sinon NaCl secretbox (legacy). */
export async function encryptMessage(
  plaintext: string,
  chatKey: Uint8Array,
): Promise<{ cipherText: string; iv: string }> {
  if (isAesGcmAvailable()) {
    return aesGcmEncrypt(plaintext, chatKey);
  }
  const iv = nacl.randomBytes(24);
  const message = naclUtil.decodeUTF8(plaintext);
  const encrypted = nacl.secretbox(message, iv, chatKey);
  return {
    cipherText: naclUtil.encodeBase64(encrypted),
    iv:         naclUtil.encodeBase64(iv),
  };
}

/** Déchiffre GCM (IV 12 octets) ou secretbox legacy (IV 24 octets). */
export async function decryptMessage(
  cipherText: string,
  iv: string,
  chatKey: Uint8Array,
): Promise<string | null> {
  if (isLikelyGcmIv(iv) && isAesGcmAvailable()) {
    const gcm = await aesGcmDecrypt(cipherText, iv, chatKey);
    if (gcm !== null) return gcm;
  }
  try {
    const box = naclUtil.decodeBase64(cipherText);
    const nonce = naclUtil.decodeBase64(iv);
    const opened = nacl.secretbox.open(box, nonce, chatKey);
    if (!opened) return null;
    return naclUtil.encodeUTF8(opened);
  } catch {
    return null;
  }
}
