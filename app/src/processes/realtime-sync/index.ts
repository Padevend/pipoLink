import { WS_EVENTS } from '@/shared/constants/ws-events';
import { queryClient } from '@/providers';
import { on } from '@/shared/websocket/manager';

interface MessageEventPayload {
  conversationId: string;
}

interface DocumentEventPayload {
  folderId: string;
}

export function setupRealtimeSync(): () => void {
  const unsubscribers = [
    on<MessageEventPayload>(WS_EVENTS.MESSAGE_CREATED, ({ conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }),
    on<MessageEventPayload>(WS_EVENTS.MESSAGE_READ, ({ conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }),
    on<DocumentEventPayload>(WS_EVENTS.DOCUMENT_UPLOADED, ({ folderId }) => {
      void queryClient.invalidateQueries({ queryKey: ['documents', folderId] });
    }),
    on<void>(WS_EVENTS.NOTIFICATION_CREATED, () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
