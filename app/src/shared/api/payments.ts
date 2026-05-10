import { api } from './client';

export interface PaymentInit {
  id: string;
  providerUrl: string;
  amount: number;
}

export const paymentsApi = {
  initiate: (payload: { amount: number; provider: string }) => 
    api.post<PaymentInit>('/payments/initiate', payload),

  confirmSimulate: (id: string) => 
    api.post<void>(`/payments/${id}/confirm-simulate`),

  getStatus: (id: string) => 
    api.get<{ status: string }>(`/payments/${id}/status`),
};
