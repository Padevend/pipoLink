import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/shared/api/ai';

export const aiKeys = {
  all: ['ai'] as const,
  sessions: () => [...aiKeys.all, 'sessions'] as const,
  history: (sessionId: string) => [...aiKeys.all, 'history', sessionId] as const,
};

export const useAiSessions = () => {
  return useQuery({
    queryKey: aiKeys.sessions(),
    queryFn: async () => {
      try {
        const remote = await aiApi.getSessions();
        const { localDb } = await import('@/shared/storage/local-db');
        localDb.upsertAiSessions(remote);
        return remote;
      } catch {
        const { localDb } = await import('@/shared/storage/local-db');
        return localDb.getAiSessions();
      }
    },
  });
};

export const useAiHistory = (sessionId: string) => {
  return useQuery({
    queryKey: aiKeys.history(sessionId),
    queryFn: async () => {
      try {
        const remote = await aiApi.getSessionHistory(sessionId);
        const { localDb } = await import('@/shared/storage/local-db');
        localDb.upsertAiMessages(sessionId, remote);
        return remote;
      } catch {
        const { localDb } = await import('@/shared/storage/local-db');
        return localDb.getAiMessages(sessionId);
      }
    },
    enabled: !!sessionId,
  });
};

export const useAiChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: { message: string; sessionId?: string }) => 
      aiApi.sendMessage(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
      if (data.session.id) {
        queryClient.invalidateQueries({ queryKey: aiKeys.history(data.session.id) });
      }
    },
  });
};
