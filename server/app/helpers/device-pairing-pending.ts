/** Session d'appairage initiée par l'appareil secondaire (sans authentification). */
export type DevicePairingSession = {
  token: string;
  shortCode: string;
  deviceName: string;
  platform: string;
  fingerprint: string;
  publicKey: string;
  keySignature: string;
  expiresAt: number;
};

const sessionsByToken = new Map<string, DevicePairingSession>();
const sessionsByCode = new Map<string, string>();

function purgeExpired(session: DevicePairingSession): boolean {
  if (Date.now() > session.expiresAt) {
    sessionsByToken.delete(session.token);
    sessionsByCode.delete(session.shortCode);
    return true;
  }
  return false;
}

export function storePairingSession(session: DevicePairingSession): void {
  sessionsByToken.set(session.token, session);
  sessionsByCode.set(session.shortCode, session.token);
  const ttl = session.expiresAt - Date.now();
  if (ttl > 0) {
    setTimeout(() => {
      sessionsByToken.delete(session.token);
      sessionsByCode.delete(session.shortCode);
    }, ttl);
  }
}

export function getPairingByToken(token: string): DevicePairingSession | null {
  const s = sessionsByToken.get(token);
  if (!s || purgeExpired(s)) return null;
  return s;
}

export function getPairingByShortCode(shortCode: string): DevicePairingSession | null {
  const token = sessionsByCode.get(shortCode.trim().toUpperCase());
  if (!token) return null;
  return getPairingByToken(token);
}

export function consumePairingSession(token: string): DevicePairingSession | null {
  const s = getPairingByToken(token);
  if (!s) return null;
  sessionsByToken.delete(token);
  sessionsByCode.delete(s.shortCode);
  return s;
}
