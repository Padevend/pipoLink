import { generateSessionKeys } from './keys';

export async function rotateKeys(recipientPublicKey: Uint8Array): Promise<{ rotated: boolean }> {
  await generateSessionKeys(recipientPublicKey);
  return { rotated: true };
}
