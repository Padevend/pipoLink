import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { getSecureItem, setSecureItem } from '@/shared/storage/secure-storage';

const SK_BOX = 'identity_private_key';
const SK_SIGN = 'identity_signing_private_key';
const PK_BOX = 'identity_public_key';

function packKeySignature(signingPublicKey: Uint8Array, detachedSig: Uint8Array): string {
  const packed = new Uint8Array(32 + 64);
  packed.set(signingPublicKey, 0);
  packed.set(detachedSig, 32);
  return naclUtil.encodeBase64(packed);
}

/**
 * Génère ou recharge les clés d'identité (X25519 box + Ed25519 sign).
 * La clé privée box ne quitte jamais le SecureStore.
 */
export async function generateIdentityKeys(): Promise<{ publicKey: string; signature: string }> {
  const existingPk = await getSecureItem(PK_BOX);
  const existingSk = await getSecureItem(SK_BOX);
  const existingSign = await getSecureItem(SK_SIGN);
  if (existingPk && existingSk && existingSign) {
    const boxPub = naclUtil.decodeBase64(existingPk);
    const signSecret = naclUtil.decodeBase64(existingSign);
    const sig = nacl.sign.detached(boxPub, signSecret);
    const signPub = nacl.sign.keyPair.fromSecretKey(signSecret).publicKey;
    return { publicKey: existingPk, signature: packKeySignature(signPub, sig) };
  }

  const boxPair = nacl.box.keyPair();
  const signPair = nacl.sign.keyPair();
  const sig = nacl.sign.detached(boxPair.publicKey, signPair.secretKey);

  await setSecureItem(SK_BOX, naclUtil.encodeBase64(boxPair.secretKey));
  await setSecureItem(SK_SIGN, naclUtil.encodeBase64(signPair.secretKey));
  await setSecureItem(PK_BOX, naclUtil.encodeBase64(boxPair.publicKey));

  return {
    publicKey: naclUtil.encodeBase64(boxPair.publicKey),
    signature: packKeySignature(signPair.publicKey, sig),
  };
}

export async function getPublicKey(): Promise<string | null> {
  return getSecureItem(PK_BOX);
}

export async function getIdentityPrivateKeyBytes(): Promise<Uint8Array | null> {
  const b64 = await getSecureItem(SK_BOX);
  if (!b64) return null;
  return naclUtil.decodeBase64(b64);
}

export interface SessionKeys {
  sessionKey: Uint8Array;
  iv: Uint8Array;
}

export async function generateSessionKeys(recipientPublicKey: Uint8Array): Promise<SessionKeys> {
  const privateKeyBase64 = await getSecureItem(SK_BOX);
  const privateKey = privateKeyBase64 ? naclUtil.decodeBase64(privateKeyBase64) : nacl.box.keyPair().secretKey;
  const sharedSecret = nacl.box.before(recipientPublicKey, privateKey);
  const sessionKey = nacl.hash(sharedSecret).slice(0, 32);
  const iv = nacl.randomBytes(24);
  return { sessionKey, iv };
}
