import { api } from './client';

export interface Subscription {
  id: string;
  status: string;
  planId: string;
  expiresAt: string;
}

export const subscriptionsApi = {
  getSubscriptions: () => 
    api.get<Subscription[]>('/subscriptions'),
};
