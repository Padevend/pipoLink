import { useMutation } from '@tanstack/react-query';
import { paymentsApi, type InitiatePaymentPayload } from '@/shared/api/payments';

/**
 * Hook to initiate a Mobile Money payment.
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (payload: InitiatePaymentPayload) =>
      paymentsApi.initiate(payload),
  });
}
