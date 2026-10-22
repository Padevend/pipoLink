import { api } from './client';

export interface InitiatePaymentPayload {
  provider: 'MTN' | 'ORANGE';
  phone: string;
  promoCode?: string;
}

export interface PromoOffer {
  code: string;
  discountPercent: number;
  freePremiumDays: number;
  discountAmount: number;
  amount: number;
}

export interface InitiatePaymentResponse {
  amount: number; 
  createdAt: string; 
  currency: string; 
  expiresAt: string; 
  id: string; 
  paidAt: string | null; 
  provider: string; 
  providerRef: string; 
  status: string; 
  subscription_id: string; 
  user_id: string;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export const paymentsApi = {
  initiate: (payload: InitiatePaymentPayload) => 
    api.post<InitiatePaymentResponse>('/payments/initiate', payload),

  validatePromo: (promoCode: string) =>
    api.post<PromoOffer>('/payments/validate-promo', { promoCode }),

  getStatus: (id: string) => 
    api.get<PaymentStatusResponse>(`/payments/${id}/status`),
};
