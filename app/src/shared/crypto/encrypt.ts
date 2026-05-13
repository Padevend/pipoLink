import { decryptMessage as dec, encryptMessage as enc } from '@/shared/crypto/message';

export interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export async function encryptMessage(plaintext: string, sessionKey: Uint8Array): Promise<EncryptedMessage> {
  const { cipherText, iv } = await enc(plaintext, sessionKey);
  return { ciphertext: cipherText, iv, authTag: 'aes-gcm-or-secretbox' };
}

export async function decryptMessage(
  ciphertext: string,
  iv: string,
  _authTag: string,
  sessionKey: Uint8Array,
): Promise<string> {
  const plain = await dec(ciphertext, iv, sessionKey);
  if (!plain) {
    throw new Error('DecryptionError');
  }
  return plain;
}
