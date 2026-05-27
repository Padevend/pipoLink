import { useMutation } from '@tanstack/react-query';
import { accountApi, type ChangePasswordPayload } from '@/shared/api/account-api';

/**
 * Hook — change password mutation.
 *
 * Usage:
 *   const { mutate, isPending, error } = useChangePassword();
 *   mutate({ currentPassword, newPassword });
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      accountApi.changePassword(payload),
  });
}
