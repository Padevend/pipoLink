export type DeviceBundle = {
  publicKey: string;
  signature: string;
  chatIds: string[];
};

export async function exportDeviceBundle(_chatIds: string[]): Promise<DeviceBundle> {
  const { generateIdentityKeys, getPublicKey } = await import('@/shared/crypto/keys');
  const { publicKey, signature } = await generateIdentityKeys();
  const pk = (await getPublicKey()) ?? publicKey;
  return { publicKey: pk, signature, chatIds: _chatIds };
}

export async function importAndValidateBundle(_bundle: DeviceBundle): Promise<boolean> {
  return Boolean(_bundle.publicKey && _bundle.signature);
}
