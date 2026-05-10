import { useQuery } from '@tanstack/react-query';

import { aiApi } from '@/shared/api/ai';

export function useAiHistory(sessionId: string) {
  return useQuery({
    queryKey: ['ai-history', sessionId],
    queryFn: () => aiApi.getSessionHistory(sessionId),
  });
}
