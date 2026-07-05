import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/shared/api/payments';

/**
 * Hook to retrieve the status of a specific payment.
 */
export function usePaymentStatus(paymentId: string | null, options: { enabled?: boolean; refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: ['paymentStatus', paymentId],
    queryFn: () => {
      if (!paymentId) throw new Error('Payment ID is required');
      return paymentsApi.getStatus(paymentId);
    },
    enabled: !!paymentId && options.enabled,
    refetchInterval: options.refetchInterval,
  });
}
