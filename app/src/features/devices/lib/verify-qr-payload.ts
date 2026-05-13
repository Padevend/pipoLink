import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export type DeviceQrPayloadV1 = {
  v: 1;
  token: string;
  publicKey: string;
  keySignature: string;
  deviceName: string;
  platform: string;
  fingerprint: string;
};

export function parseDeviceQrPayload(raw: string): DeviceQrPayloadV1 | null {
  try {
    const data = JSON.parse(raw) as DeviceQrPayloadV1;
    if (data?.v !== 1 || !data.token || !data.publicKey || !data.keySignature) return null;
    return data;
  } catch {
    return null;
  }
}

/** Vérifie la signature Ed25519 embarquée (même format que le backend). */
export function verifyDeviceQrPayloadSignature(payload: DeviceQrPayloadV1): boolean {
  try {
    const boxPub = naclUtil.decodeBase64(payload.publicKey);
    if (boxPub.length !== 32) return false;
    const packed = naclUtil.decodeBase64(payload.keySignature);
    if (packed.length !== 96) return false;
    const edPub = packed.subarray(0, 32);
    const sig = packed.subarray(32, 96);
    return nacl.sign.detached.verify(boxPub, sig, edPub);
  } catch {
    return false;
  }
}
