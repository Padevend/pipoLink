import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth';

export function useLoginPhone() {
  return useMutation({
    mutationFn: (phone: string) => authApi.requestOtp(phone),
  });
}
