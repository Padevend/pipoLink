/** Résultat de liaison QR en attente de récupération par le nouvel appareil (agent.md §10). */
export type QrLinkPendingResult = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string | null;
  user: { id: string; email: string | null; username: string | null; role: string };
  device: { id: string; name: string; platform: string };
};

const pending = new Map<string, { result: QrLinkPendingResult; expiresAt: number }>();

export function storeQrLinkResult(token: string, result: QrLinkPendingResult, ttlMs = 120_000): void {
  pending.set(token, { result, expiresAt: Date.now() + ttlMs });
  setTimeout(() => pending.delete(token), ttlMs);
}

export function consumeQrLinkResult(token: string): QrLinkPendingResult | null {
  const entry = pending.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    pending.delete(token);
    return null;
  }
  pending.delete(token);
  return entry.result;
}

export function peekQrLinkResult(token: string): QrLinkPendingResult | null {
  const entry = pending.get(token);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.result;
}
