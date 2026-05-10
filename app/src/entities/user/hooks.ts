import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/shared/api/user';
import { UserProfile } from '@/shared/api/types';

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
};

export const useMe = () => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => userApi.getMe(),
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => userApi.updateProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
};
