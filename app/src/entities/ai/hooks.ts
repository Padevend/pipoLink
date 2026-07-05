import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/shared/api/ai';
import { localDb } from '@/shared/storage/local-db';

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
        localDb.upsertAiSessions(remote);
        return remote;
      } catch {
        return localDb.getAiSessions();
      }
    },
    initialData: () => {
      const cached = localDb.getAiSessions();
      return cached.length > 0 ? cached : undefined;
    },
  });
};

export const useAiHistory = (sessionId: string) => {
  return useQuery({
    queryKey: aiKeys.history(sessionId),
    queryFn: async () => {
      try {
        const remote = await aiApi.getSessionHistory(sessionId);
        localDb.upsertAiMessages(sessionId, remote.messages);
        return remote.messages;
      } catch (e) {
        return localDb.getAiMessages(sessionId);
      }
    },
    enabled: !!sessionId,
    initialData: () => {
      if (!sessionId) return undefined;
      const cached = localDb.getAiMessages(sessionId);
      return cached.length > 0 ? cached : undefined;
    },
  });
};

export const useAiChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { message: string; sessionId?: string }) =>{
      // add msg to view (optimistic)
      if (payload.sessionId) {
        queryClient.setQueryData(aiKeys.history(payload.sessionId), (old: any) => {
          const existing = old || [];
          const tempId = `temp-${Date.now()}`;
          return [...existing, { id: tempId, role: 'user', content: payload.message }];
        });
      }

      return aiApi.sendMessage(payload)
    },
    onSuccess: (data, payload) => {
      queryClient.setQueryData(aiKeys.sessions(), (old: any) => {
        const existing = old || [];
        if (!existing.some((s: any) => s.id === data.session.id)) {
          return [data.session, ...existing];
        }
        return existing;
      });

      if (data.session.id) {
        queryClient.setQueryData(aiKeys.history(data.session.id), (old: any) => {
          let existing = old || [];
          
          // Nettoyer les messages temporaires optimistes
          existing = existing.filter((msg: any) => !msg.id.startsWith('temp-'));
          
          const newMessages = [];
          if (data.request && !existing.some((msg: any) => msg.id === data.request.id)) {
            newMessages.push(data.request);
          }
          if (data.message && !existing.some((msg: any) => msg.id === data.message.id)) {
            newMessages.push(data.message);
          }
          
          return [...existing, ...newMessages];
        });
      }
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => aiApi.deleteSessions(sessionId),
    onSuccess(_, variables) {
      queryClient.setQueryData(aiKeys.sessions(), (old: any) => {
        const existing = old || [];
        return existing.filter((s: any) => s.id !== variables);
      });
      queryClient.setQueryData(aiKeys.history(variables), []);
    },
  });
};

export const useSessionDocuments = (sessionId: string) => {
  return useQuery({
    queryKey: [...aiKeys.history(sessionId), 'documents'],
    queryFn: () => aiApi.getSessionDocuments(sessionId),
    enabled: !!sessionId,
  });
};

export const useAddDocumentToSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, documentId }: { sessionId: string; documentId: string }) =>
      aiApi.addDocumentToSession(sessionId, documentId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...aiKeys.history(variables.sessionId), 'documents'] });
      void queryClient.invalidateQueries({ queryKey: aiKeys.history(variables.sessionId) });
    },
  });
};

export const useRemoveDocumentFromSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, documentId }: { sessionId: string; documentId: string }) =>
      aiApi.removeDocumentFromSession(sessionId, documentId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...aiKeys.history(variables.sessionId), 'documents'] });
      void queryClient.invalidateQueries({ queryKey: aiKeys.history(variables.sessionId) });
    },
  });
};

export const useGenerateStudyAid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, type }: { sessionId: string; type: string }) =>
      aiApi.generateStudyAid(sessionId, type),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(aiKeys.history(variables.sessionId), (old: any) => {
        const existing = old || [];
        if (!existing.some((msg: any) => msg.id === data.message.id)) {
          return [...existing, data.message];
        }
        return existing;
      });
    },
  });
};