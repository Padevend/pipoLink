/**
 * Vérifie l'attestation d'une clé publique X25519 (NaCl box) :
 * deviceKeySignature = base64( ed25519PublicKey32 || detachedSignature64 )
 * sur le message = bytes de la clé publique X25519 (32 octets).
 */
export async function verifyDeviceKeyAttestation(
  devicePublicKeyBase64: string,
  deviceKeySignatureBase64: string,
): Promise<boolean> {
  let boxPub: Buffer;
  try {
    boxPub = Buffer.from(devicePublicKeyBase64, "base64");
  } catch {
    return false;
  }
  if (boxPub.length !== 32) return false;

  let packed: Buffer;
  try {
    packed = Buffer.from(deviceKeySignatureBase64, "base64");
  } catch {
    return false;
  }
  if (packed.length !== 96) return false;

  const edPub = new Uint8Array(packed.subarray(0, 32));
  const sig = new Uint8Array(packed.subarray(32, 96));
  const message = new Uint8Array(boxPub);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return false;

  try {
    const key = await subtle.importKey("raw", edPub, { name: "Ed25519" }, false, ["verify"]);
    return await subtle.verify({ name: "Ed25519" }, key, sig, message);
  } catch {
    return false;
  }
}
