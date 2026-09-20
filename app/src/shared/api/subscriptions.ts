import { api } from './client';

export interface Subscription {
  id: string;
  status: string;
  plan: string;
  activationSource: string;
  autoRenew: boolean;
  currentPeriodEnd: string | null;
}

export const subscriptionsApi = {
  getSubscriptions: () => api.get<Subscription>("/subscriptions"),
  setAutoRenew: (autoRenew: boolean) => api.patch<Subscription>("/subscriptions/auto-renew", { autoRenew }),
};
