import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export async function encryptMessage(plaintext: string, sessionKey: Uint8Array): Promise<EncryptedMessage> {
  const iv = nacl.randomBytes(24);
  const message = naclUtil.decodeUTF8(plaintext);
  const encrypted = nacl.secretbox(message, iv, sessionKey);
  return {
    ciphertext: naclUtil.encodeBase64(encrypted),
    iv: naclUtil.encodeBase64(iv),
    authTag: 'secretbox',
  };
}

export async function decryptMessage(
  ciphertext: string,
  iv: string,
  _authTag: string,
  sessionKey: Uint8Array,
): Promise<string> {
  const box = naclUtil.decodeBase64(ciphertext);
  const nonce = naclUtil.decodeBase64(iv);
  const opened = nacl.secretbox.open(box, nonce, sessionKey);
  if (!opened) {
    throw new Error('DecryptionError');
  }

  return naclUtil.encodeUTF8(opened);
}
