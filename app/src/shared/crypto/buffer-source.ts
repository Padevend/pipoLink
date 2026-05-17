/** Copie un Uint8Array vers un buffer compatible Web Crypto (`ArrayBuffer`). */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

export function asBufferSource(bytes: Uint8Array): BufferSource {
  return new Uint8Array(toArrayBuffer(bytes));
}
