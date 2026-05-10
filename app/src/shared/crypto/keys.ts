import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { getSecureItem, setSecureItem } from '@/shared/storage/secure-storage';

export interface IdentityKeys {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SessionKeys {
  sessionKey: Uint8Array;
  iv: Uint8Array;
}

export async function generateIdentityKeys(): Promise<IdentityKeys> {
  const keyPair = nacl.box.keyPair();
  await setSecureItem('identity_private_key', naclUtil.encodeBase64(keyPair.secretKey));
  await setSecureItem('identity_public_key', naclUtil.encodeBase64(keyPair.publicKey));
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
  };
}

export async function generateSessionKeys(recipientPublicKey: Uint8Array): Promise<SessionKeys> {
  const privateKeyBase64 = await getSecureItem('identity_private_key');
  const privateKey = privateKeyBase64 ? naclUtil.decodeBase64(privateKeyBase64) : nacl.box.keyPair().secretKey;
  const sharedSecret = nacl.box.before(recipientPublicKey, privateKey);
  const sessionKey = nacl.hash(sharedSecret).slice(0, 32);
  const iv = nacl.randomBytes(24);
  return { sessionKey, iv };
}
