import { AiTokenService } from "../services/ai-token.service.js";

const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

/**
 * Scheduled job responsible for restoring AI tokens when the restoration window
 * (6h for FREE, 3h30 for PREMIUM) expires.
 */
export function startAiTokenRestorationJob(): void {
  const service = new AiTokenService();
  const tick = () =>
    void service
      .processTokenRestorationCron()
      .then((count) => {
        if (count > 0) {
          console.log(`[ai-token-restoration] Jetons restaurés pour ${count} utilisateur(s).`);
        }
      })
      .catch((e) => console.error("[ai-token-restoration] Erreur job:", e));

  tick();
  setInterval(tick, CHECK_INTERVAL_MS);
}
