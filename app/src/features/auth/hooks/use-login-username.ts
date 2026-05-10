import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/providers';
import { authApi } from '@/shared/api/auth';

export function useLoginUsername() {
  const { signInWithTokens } = useAuth();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) =>
      authApi.login({ email: username, password }),
    onSuccess: async (result) => {
      await signInWithTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt
      }, result.user);
    },
  });
}
