import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';

import { secureRandomBytes } from '@/shared/crypto/secure-random';
import naclUtil from 'tweetnacl-util';

import { asBufferSource } from '@/shared/crypto/buffer-source';

const GCM_TAG_BITS = 128;

function getSubtle(): SubtleCrypto | null {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.encrypt !== 'function') return null;
  return subtle;
}

export function isAesGcmAvailable(): boolean {
  return Boolean(getSubtle()) || true;
}

function nobleEncrypt(plaintext: string, key32: Uint8Array): { cipherText: string; iv: string } {
  const iv = secureRandomBytes(12);
  const aes = gcm(key32, iv);
  const ct = aes.encrypt(utf8ToBytes(plaintext));
  return { cipherText: naclUtil.encodeBase64(ct), iv: naclUtil.encodeBase64(iv) };
}

function nobleDecrypt(cipherTextB64: string, ivB64: string, key32: Uint8Array): string | null {
  try {
    const iv = naclUtil.decodeBase64(ivB64);
    if (iv.length !== 12) return null;
    const ct = naclUtil.decodeBase64(cipherTextB64);
    const aes = gcm(key32, iv);
    return bytesToUtf8(aes.decrypt(ct));
  } catch {
    return null;
  }
}

export async function aesGcmEncrypt(
  plaintext: string,
  key32: Uint8Array,
): Promise<{ cipherText: string; iv: string }> {
  const subtle = getSubtle();
  if (!subtle) {
    return nobleEncrypt(plaintext, key32);
  }

  const iv = new Uint8Array(12);
  globalThis.crypto!.getRandomValues(iv);
  const cryptoKey = await subtle.importKey(
    'raw',
    asBufferSource(key32),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const pt = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS }, cryptoKey, pt),
  );
  return {
    cipherText: naclUtil.encodeBase64(ct),
    iv: naclUtil.encodeBase64(iv),
  };
}

export async function aesGcmDecrypt(
  cipherTextB64: string,
  ivB64: string,
  key32: Uint8Array,
): Promise<string | null> {
  const subtle = getSubtle();
  if (!subtle) {
    return nobleDecrypt(cipherTextB64, ivB64, key32);
  }

  try {
    const iv = naclUtil.decodeBase64(ivB64);
    if (iv.length !== 12) return null;
    const ct = naclUtil.decodeBase64(cipherTextB64);
    const cryptoKey = await subtle.importKey(
      'raw',
      asBufferSource(key32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );
    const plain = await subtle.decrypt(
      { name: 'AES-GCM', iv: asBufferSource(iv), tagLength: GCM_TAG_BITS },
      cryptoKey,
      asBufferSource(ct),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return nobleDecrypt(cipherTextB64, ivB64, key32);
  }
}
