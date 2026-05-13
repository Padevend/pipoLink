import { useCallback } from 'react';

import { encryptMessage } from '@/shared/crypto/encrypt';
import { useKeyExchange } from './use-key-exchange';

export function useEncryptMessage(conversationId: string) {
  const { sessionKey } = useKeyExchange(conversationId);

  return useCallback(async (message: string) => {
    const enc = await encryptMessage(message, sessionKey);
    return enc;
  }, [sessionKey]);
}
