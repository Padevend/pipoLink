import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth';
import { useAuth } from '@/providers';

export function useVerifyOtp() {
  const { signInWithTokens } = useAuth();

  return useMutation({
    mutationFn: async (payload: { email: string; code: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) => 
      authApi.verifyOtp(payload),
    onSuccess: async (result) => {
      if (result) {
        await signInWithTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt
        }, result.user);
      }
    },
  });
}
