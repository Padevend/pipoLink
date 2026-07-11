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
    mutationFn: async (payload: ChangePasswordPayload) => {
      const res = await accountApi.changePassword(payload);
      try {
        const { createKeyBackup } = await import('@/shared/crypto/backup');
        const { authApi } = await import('@/shared/api/auth');
        const backup = await createKeyBackup(payload.newPassword);
        if (backup) {
          await authApi.backupKey(backup);
        }
      } catch (err) {
        console.error('Silent key backup upload failed during change password:', err);
      }
      return res;
    },
  });
}
