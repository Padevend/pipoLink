import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/providers';

export function useLogout() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: logout,
  });
}
