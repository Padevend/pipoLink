import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export interface DeviceKeyBundle {
  publicKey: string;
  signature: string;
  deviceId: string;
}

export async function exportDeviceKeys(): Promise<DeviceKeyBundle> {
  const keyPair = nacl.box.keyPair();
  const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
  return {
    publicKey,
    signature: naclUtil.encodeBase64(nacl.hash(keyPair.publicKey).slice(0, 32)),
    deviceId: 'mock-device',
  };
}

export async function importDeviceKeys(bundle: DeviceKeyBundle): Promise<boolean> {
  return Boolean(bundle.publicKey && bundle.signature && bundle.deviceId);
}
