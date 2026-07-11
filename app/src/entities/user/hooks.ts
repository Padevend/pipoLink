import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '@/providers/query-provider';
import { userApi } from '@/shared/api/user';
import { patchCurrentUserProfile, setCurrentUser } from '@/shared/lib/query-cache';
import type { UserProfile } from '@/shared/api/types';

import { userKeys } from './keys';

export { userKeys };

export const useMe = () => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => userApi.getMe(),
    staleTime: 60_000,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => userApi.updateProfile(profile),
    onMutate: async (profile) => {
      await qc.cancelQueries({ queryKey: userKeys.me() });
      const previous = qc.getQueryData(userKeys.me());
      patchCurrentUserProfile(qc, profile);
      return { previous };
    },
    onError: (_err, _profile, context) => {
      if (context?.previous) {
        qc.setQueryData(userKeys.me(), context.previous);
      }
    },
    onSuccess: async () => {
      const fresh = await userApi.getMe();
      setCurrentUser(qc, fresh);
    },
  });
};

export async function prefetchCurrentUser(): Promise<void> {
  const user = await userApi.getMe();
  setCurrentUser(queryClient, user);
}
