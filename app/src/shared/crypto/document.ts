import { gcm } from '@noble/ciphers/aes.js';
import naclUtil from 'tweetnacl-util';

import { isAesGcmAvailable } from '@/shared/crypto/aes-gcm';
import { asBufferSource } from '@/shared/crypto/buffer-source';
import { secureRandomBytes } from '@/shared/crypto/secure-random';
import { CRYPTO_GCM_STRICT } from '@/shared/crypto/policy';

const GCM_TAG_BITS = 128;

function assertGcmAvailable(): void {
  if (CRYPTO_GCM_STRICT && !isAesGcmAvailable()) {
    throw new Error('AES-256-GCM requis sur cet appareil (agent.md §3).');
  }
}

function getSubtle(): SubtleCrypto | null {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.encrypt !== 'function') return null;
  return subtle;
}

function nobleEncryptBuffer(buf: Uint8Array, key32: Uint8Array): { encryptedBuffer: Uint8Array; iv: string } {
  const iv = secureRandomBytes(12);
  const aes = gcm(key32, iv);
  const ct = aes.encrypt(buf);
  return { encryptedBuffer: ct, iv: naclUtil.encodeBase64(iv) };
}

async function gcmEncryptBuffer(
  buf: Uint8Array,
  key32: Uint8Array,
): Promise<{ encryptedBuffer: Uint8Array; iv: string }> {
  const subtle = getSubtle();
  if (!subtle) {
    return nobleEncryptBuffer(buf, key32);
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
  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS }, cryptoKey, asBufferSource(buf)),
  );
  return { encryptedBuffer: ct, iv: naclUtil.encodeBase64(iv) };
}

export async function encryptFile(
  fileBuffer: Uint8Array,
  chatKey: Uint8Array,
): Promise<{ encryptedBuffer: Uint8Array; iv: string }> {
  assertGcmAvailable();
  return gcmEncryptBuffer(fileBuffer, chatKey);
}

export async function decryptFile(
  encryptedBuffer: Uint8Array,
  iv: string,
  chatKey: Uint8Array,
): Promise<Uint8Array | null> {
  try {
    const nonce = naclUtil.decodeBase64(iv);
    if (nonce.length !== 12 || !isAesGcmAvailable()) return null;

    const subtle = getSubtle();
    if (!subtle) {
      const aes = gcm(chatKey, nonce);
      return aes.decrypt(encryptedBuffer);
    }

    const cryptoKey = await subtle.importKey(
      'raw',
      asBufferSource(chatKey),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );
    return new Uint8Array(
      await subtle.decrypt(
        { name: 'AES-GCM', iv: asBufferSource(nonce), tagLength: GCM_TAG_BITS },
        cryptoKey,
        asBufferSource(encryptedBuffer),
      ),
    );
  } catch {
    try {
      const nonce = naclUtil.decodeBase64(iv);
      if (nonce.length !== 12) return null;
      const aes = gcm(chatKey, nonce);
      return aes.decrypt(encryptedBuffer);
    } catch {
      return null;
    }
  }
}
