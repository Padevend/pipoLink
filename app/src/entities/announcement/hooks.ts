import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { announcementsApi, type Announcement } from '@/shared/api/announcements';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: () => [...announcementKeys.all, 'list'] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: () => announcementsApi.getAnnouncements(),
    staleTime: 30_000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      announcementsApi.createAnnouncement(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Announcement[]>(announcementKeys.list(), (prev) =>
        prev ? [created, ...prev.filter((a) => a.id !== created.id)] : [created],
      );
    },
  });
}
