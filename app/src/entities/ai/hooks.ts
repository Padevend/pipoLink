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
    queryFn: () => aiApi.getSessions(),
  });
};

export const useAiHistory = (sessionId: string) => {
  return useQuery({
    queryKey: aiKeys.history(sessionId),
    queryFn: () => aiApi.getSessionHistory(sessionId),
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
