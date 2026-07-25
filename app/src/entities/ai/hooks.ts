import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/shared/api/ai';
import { localDb } from '@/shared/storage/local-db';
import { generateUUID } from '@/shared/utils/uuid';

export const aiKeys = {
  all: ['ai'] as const,
  sessions: () => [...aiKeys.all, 'sessions'] as const,
  history: (sessionId: string) => [...aiKeys.all, 'history', sessionId] as const,
  tokens: () => [...aiKeys.all, 'tokens'] as const,
};

export const useAiTokens = () => {
  return useQuery({
    queryKey: aiKeys.tokens(),
    queryFn: () => aiApi.getTokenStatus(),
    refetchInterval: 30000, // Refresh tokens state every 30s
  });
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

  const mutation = useMutation({
    mutationFn: async (payload: { message: string; sessionId?: string; tempId?: string }) => {
      return aiApi.sendMessage({ message: payload.message, sessionId: payload.sessionId });
    },
    onMutate: async (payload) => {
      const tempId = payload.tempId || `temp-${generateUUID()}`;
      if (payload.sessionId) {
        queryClient.setQueryData(aiKeys.history(payload.sessionId), (old: any) => {
          const existing = old || [];
          return [...existing, { id: tempId, role: 'user', content: payload.message, status: 'send', createdAt: new Date().toISOString() }];
        });
      }
      return { tempId, sessionId: payload.sessionId, message: payload.message };
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionId && context?.tempId) {
        queryClient.setQueryData(aiKeys.history(context.sessionId), (old: any) => {
          let existing = old || [];
          return existing.map((msg: any) =>
            msg.id === context.tempId ? { ...msg, status: 'fail' } : msg
          );
        });

        localDb.upsertAiMessages(context.sessionId, [
          {
            id: context.tempId,
            role: 'user',
            content: context.message,
            createdAt: new Date().toISOString(),
            status: 'fail',
          },
        ]);
      }
    },
    onSuccess: (data, payload, context) => {
      queryClient.setQueryData(aiKeys.sessions(), (old: any) => {
        const existing = old || [];
        if (!existing.some((s: any) => s.id === data.session.id)) {
          return [data.session, ...existing];
        }
        return existing;
      });

      if (data.tokens) {
        queryClient.setQueryData(aiKeys.tokens(), data.tokens);
      } else {
        void queryClient.invalidateQueries({ queryKey: aiKeys.tokens() });
      }

      if (data.session.id) {
        queryClient.setQueryData(aiKeys.history(data.session.id), (old: any) => {
          let existing = old || [];
          
          // Nettoyer le message temporaire optimiste
          if (context?.tempId) {
            existing = existing.filter((msg: any) => msg.id !== context.tempId);
          } else {
            existing = existing.filter((msg: any) => !msg.id.startsWith('temp-'));
          }
          
          const newMessages = [];
          if (data.request && !existing.some((msg: any) => msg.id === data.request.id)) {
            newMessages.push(data.request);
          }
          if (data.message && !existing.some((msg: any) => msg.id === data.message.id)) {
            newMessages.push(data.message);
          }
          
          const updated = [...existing, ...newMessages];
          localDb.upsertAiMessages(data.session.id, updated);
          return updated;
        });
      }
    },
  });

  const deleteFailedAiMessage = (sessionId: string, messageId: string) => {
    queryClient.setQueryData(aiKeys.history(sessionId), (old: any) => {
      const existing = old || [];
      return existing.filter((m: any) => m.id !== messageId);
    });
    localDb.deleteAiMessage(messageId);
  };

  const retryFailedAiMessage = (sessionId: string, msg: any) => {
    deleteFailedAiMessage(sessionId, msg.id);
    mutation.mutate({ message: msg.content, sessionId });
  };

  return {
    ...mutation,
    deleteFailedAiMessage,
    retryFailedAiMessage,
  };
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
      void queryClient.invalidateQueries({ queryKey: aiKeys.tokens() });
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

export const useMyAiAttachments = () => {
  return useQuery({
    queryKey: [...aiKeys.all, 'attachments'] as const,
    queryFn: () => aiApi.getAttachments(),
  });
};

export const useUploadAiAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      file: { uri: string; name: string; mimeType: string; size?: number };
      metadata: {
        title: string;
        type: string;
        filiere: string;
        niveau: string;
        ue: string;
        description?: string;
      };
    }) => aiApi.uploadAttachment(payload.file, payload.metadata),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...aiKeys.all, 'attachments'] });
    },
  });
};

export const useDeleteAiAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteAttachment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...aiKeys.all, 'attachments'] });
    },
  });
};