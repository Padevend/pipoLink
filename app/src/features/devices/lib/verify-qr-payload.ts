import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

/** Payload QR v2 — appairage sans authentification préalable. */
export type DeviceQrPayloadV2 = {
  v: 2;
  token: string;
  shortCode: string;
  publicKey: string;
  keySignature: string;
  deviceName: string;
  platform: string;
  fingerprint: string;
};

/** @deprecated Ancien format — conservé pour compatibilité lecture */
export type DeviceQrPayloadV1 = {
  v: 1;
  token: string;
  publicKey: string;
  keySignature: string;
  deviceName: string;
  platform: string;
  fingerprint: string;
};

export type DeviceQrPayload = DeviceQrPayloadV2 | DeviceQrPayloadV1;

export function parseDeviceQrPayload(raw: string): DeviceQrPayload | null {
  try {
    const data = JSON.parse(raw) as DeviceQrPayload;
    if (data?.v === 2) {
      if (!data.token || !data.shortCode || !data.publicKey || !data.keySignature) return null;
      return data;
    }
    if (data?.v === 1) {
      if (!data.token || !data.publicKey || !data.keySignature) return null;
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getPayloadToken(payload: DeviceQrPayload): string {
  return payload.token;
}

/** Vérifie la signature Ed25519 embarquée (même format que le backend). */
export function verifyDeviceQrPayloadSignature(payload: DeviceQrPayload): boolean {
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
