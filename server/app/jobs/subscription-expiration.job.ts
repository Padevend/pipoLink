import { SubscriptionService } from "../services/subscription.service.js";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Rétrograde les abonnements PREMIUM expirés (currentPeriodEnd dépassé)
 * en FREE/EXPIRED — sans ce job, les abonnements expirés restaient actifs.
 */
export function startSubscriptionExpirationJob(): void {
  const service = new SubscriptionService();
  const tick = () =>
    void service.checkExpirations().catch((e) => console.error("[subscription-expiration]", e));

  tick();
  setInterval(tick, HOUR_MS);
}
