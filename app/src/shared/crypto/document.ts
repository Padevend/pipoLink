import naclUtil from 'tweetnacl-util';

import { isAesGcmAvailable } from '@/shared/crypto/aes-gcm';
import { CRYPTO_GCM_STRICT } from '@/shared/crypto/policy';

const GCM_TAG_BITS = 128;

function assertGcmAvailable(): void {
  if (CRYPTO_GCM_STRICT && !isAesGcmAvailable()) {
    throw new Error('AES-256-GCM requis sur cet appareil (agent.md §3).');
  }
}

async function gcmEncryptBuffer(buf: Uint8Array, key32: Uint8Array): Promise<{ encryptedBuffer: Uint8Array; iv: string }> {
  const subtle = globalThis.crypto!.subtle;
  const iv = new Uint8Array(12);
  globalThis.crypto!.getRandomValues(iv);
  const cryptoKey = await subtle.importKey('raw', key32 as BufferSource, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS }, cryptoKey, buf));
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
    const subtle = globalThis.crypto!.subtle;
    const cryptoKey = await subtle.importKey('raw', chatKey as BufferSource, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return new Uint8Array(
      await subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: GCM_TAG_BITS }, cryptoKey, encryptedBuffer),
    );
  } catch {
    return null;
  }
}
