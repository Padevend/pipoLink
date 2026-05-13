import naclUtil from 'tweetnacl-util';

const GCM_TAG_BITS = 128;

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('AES-GCM nécessite Web Crypto (crypto.subtle).');
  }
  return subtle;
}

export function isAesGcmAvailable(): boolean {
  return Boolean(globalThis.crypto?.subtle);
}

export async function aesGcmEncrypt(
  plaintext: string,
  key32: Uint8Array,
): Promise<{ cipherText: string; iv: string }> {
  const subtle = getSubtle();
  const iv = new Uint8Array(12);
  globalThis.crypto!.getRandomValues(iv);
  const cryptoKey = await subtle.importKey('raw', key32 as BufferSource, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const pt = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS }, cryptoKey, pt));
  return {
    cipherText: naclUtil.encodeBase64(ct),
    iv:         naclUtil.encodeBase64(iv),
  };
}

export async function aesGcmDecrypt(
  cipherTextB64: string,
  ivB64: string,
  key32: Uint8Array,
): Promise<string | null> {
  try {
    const subtle = getSubtle();
    const iv = naclUtil.decodeBase64(ivB64);
    if (iv.length !== 12) return null;
    const ct = naclUtil.decodeBase64(cipherTextB64);
    const cryptoKey = await subtle.importKey('raw', key32 as BufferSource, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await subtle.decrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS }, cryptoKey, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
