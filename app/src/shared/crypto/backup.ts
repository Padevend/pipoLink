import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { deriveKeyFromPassword } from './kdf';
import { aesGcmEncrypt, aesGcmDecrypt } from './aes-gcm';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';
import { secureRandomBytes } from './secure-random';

const SK_BOX = SECURE_STORAGE_KEYS.IDENTITY_PRIVATE_KEY;
const SK_SIGN = SECURE_STORAGE_KEYS.IDENTITY_SIGNING_PRIVATE_KEY;
const PK_BOX = SECURE_STORAGE_KEYS.IDENTITY_PUBLIC_KEY;

/**
 * Creates an encrypted backup payload of the local identity private keys using the user's password.
 */
export async function createKeyBackup(password: string): Promise<{ encryptedKey: string; salt: string } | null> {
  try {
    const boxPrivateKey = await SecureStorageService.get(SK_BOX);
    const signingPrivateKey = await SecureStorageService.get(SK_SIGN);

    if (!boxPrivateKey || !signingPrivateKey) {
      return null;
    }

    const payload = JSON.stringify({
      boxPrivateKey,
      signingPrivateKey,
    });

    const saltBytes = secureRandomBytes(16);
    const derivedKey = await deriveKeyFromPassword(password, saltBytes);

    const { cipherText, iv } = await aesGcmEncrypt(payload, derivedKey);

    const backupData = JSON.stringify({
      iv,
      cipherText,
    });

    const backupBytes = naclUtil.decodeUTF8(backupData);
    const encryptedKey = naclUtil.encodeBase64(backupBytes);
    const salt = naclUtil.encodeBase64(saltBytes);

    return { encryptedKey, salt };
  } catch (err) {
    console.error('Failed to create key backup:', err);
    return null;
  }
}

/**
 * Restores the identity keys from the encrypted backup payload and saves them locally.
 */
export async function restoreKeyBackup(password: string, encryptedKey: string, salt: string): Promise<boolean> {
  try {
    const saltBytes = naclUtil.decodeBase64(salt);
    const derivedKey = await deriveKeyFromPassword(password, saltBytes);

    const backupBytes = naclUtil.decodeBase64(encryptedKey);
    const backupDataStr = naclUtil.encodeUTF8(backupBytes);
    const { iv, cipherText } = JSON.parse(backupDataStr);

    const decryptedJsonStr = await aesGcmDecrypt(cipherText, iv, derivedKey);
    if (!decryptedJsonStr) {
      return false;
    }

    const { boxPrivateKey, signingPrivateKey } = JSON.parse(decryptedJsonStr);
    if (!boxPrivateKey || !signingPrivateKey) {
      return false;
    }

    // Save restored keys to local SecureStore
    await SecureStorageService.set(SK_BOX, boxPrivateKey);
    await SecureStorageService.set(SK_SIGN, signingPrivateKey);

    // Reconstruct public key from secret key
    const boxSecretBytes = naclUtil.decodeBase64(boxPrivateKey);
    const boxPubBytes = nacl.box.keyPair.fromSecretKey(boxSecretBytes).publicKey;
    const boxPubBase64 = naclUtil.encodeBase64(boxPubBytes);
    await SecureStorageService.set(PK_BOX, boxPubBase64);

    return true;
  } catch (err) {
    console.error('Failed to restore key backup:', err);
    return false;
  }
}
