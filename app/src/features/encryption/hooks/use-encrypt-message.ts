import { useCallback } from 'react';

import { encryptMessage } from '@/shared/crypto/encrypt';
import { useKeyExchange } from './use-key-exchange';

export function useEncryptMessage(conversationId: string) {
  const { sessionKey } = useKeyExchange(conversationId);

  return useCallback((message: string) => encryptMessage(message, sessionKey), [sessionKey]);
}
