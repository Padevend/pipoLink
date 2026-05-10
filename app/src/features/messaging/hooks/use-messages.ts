import { useInfiniteQuery } from '@tanstack/react-query';
import { messagingApi } from '@/shared/api/messaging';
import { Message, PaginatedResponse } from '@/shared/api/types';

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) => 
      messagingApi.getMessages(conversationId, { page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Message>) => 
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}
