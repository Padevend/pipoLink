import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { getIdentityPrivateKeyBytes } from '@/shared/crypto/keys';
import { registerCachedChatId } from '@/shared/crypto/reset-device';
import { SecureStorageService } from '@/shared/lib/storage';

export function generateChatKey(): Uint8Array {
  return nacl.randomBytes(32);
}

export async function encryptChatKeyForDevice(
  chatKey: Uint8Array,
  devicePubKeyBase64: string,
): Promise<string> {
  const remotePk = naclUtil.decodeBase64(devicePubKeyBase64);
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const boxed = nacl.box(chatKey, nonce, remotePk, ephemeral.secretKey);
  const payload = new Uint8Array(ephemeral.publicKey.length + nonce.length + boxed.length);
  payload.set(ephemeral.publicKey, 0);
  payload.set(nonce, ephemeral.publicKey.length);
  payload.set(boxed, ephemeral.publicKey.length + nonce.length);
  return naclUtil.encodeBase64(payload);
}

export async function decryptChatKey(encryptedChatKey: string): Promise<Uint8Array | null> {
  const sk = await getIdentityPrivateKeyBytes();
  if (!sk) return null;
  const raw = naclUtil.decodeBase64(encryptedChatKey);
  if (raw.length < 32 + 24 + 16) return null;
  const ephemPub = raw.subarray(0, 32);
  const nonce = raw.subarray(32, 56);
  const box = raw.subarray(56);
  const opened = nacl.box.open(box, nonce, ephemPub, sk);
  return opened ?? null;
}

export async function cacheChatKey(chatId: string, key: Uint8Array): Promise<void> {
  await SecureStorageService.set(`chat_key_${chatId}`, naclUtil.encodeBase64(key));
  await registerCachedChatId(chatId);
}

export async function getCachedChatKey(chatId: string): Promise<Uint8Array | null> {
  const b64 = await SecureStorageService.get(`chat_key_${chatId}`);
  if (!b64) return null;
  return naclUtil.decodeBase64(b64);
}
