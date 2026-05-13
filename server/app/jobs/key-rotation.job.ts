import { prisma } from "../../config/database.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Repère les appareils dont la clé expire bientôt ou dépasse 90 jours,
 * et notifie via WebSocket (agent.md §11).
 */
async function runKeyRotationTick(): Promise<void> {
  const now = new Date();
  const renewBefore = new Date(now.getTime() + DAY_MS);
  const maxAge = new Date(now.getTime() - 90 * DAY_MS);

  const devices = await prisma.device.findMany({
    where: {
      revokedAt:  null,
      public_key: { not: null },
      OR: [
        {
          AND: [
            { keyExpiresAt: { not: null } },
            { keyExpiresAt: { lte: renewBefore } },
          ],
        },
        {
          AND: [
            { keyCreatedAt: { not: null } },
            { keyCreatedAt: { lte: maxAge } },
          ],
        },
      ],
    },
    select: { id: true, user_id: true },
  });

  for (const d of devices) {
    RealtimeBus.emit(
      WsEventName.KeyRotationRequired,
      { deviceId: d.id, reason: "scheduled_or_expiring" },
      { userId: d.user_id, deviceId: d.id },
    );
  }

  if (devices.length) {
    console.log(`[key-rotation] ${devices.length} appareil(s) notifiés pour rotation de clés.`);
  }
}

export function startKeyRotationJob(): void {
  void runKeyRotationTick();
  setInterval(() => {
    void runKeyRotationTick().catch((e) => console.error("[key-rotation]", e));
  }, DAY_MS);
}
