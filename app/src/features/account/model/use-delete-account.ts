import { useMutation } from '@tanstack/react-query';
import { accountApi, type DeleteAccountPayload } from '@/shared/api/account-api';

/**
 * Hook — delete account mutation.
 *
 * Usage:
 *   const { mutate, isPending, error } = useDeleteAccount();
 *   mutate({ password });
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) =>
      accountApi.deleteAccount(payload),
  });
}
