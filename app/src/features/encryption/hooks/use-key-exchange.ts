import { useMemo } from 'react';

export function useKeyExchange(conversationId: string): { sessionKey: Uint8Array } {
  const sessionKey = useMemo(() => {
    const key = new Uint8Array(32);
    for (let index = 0; index < conversationId.length; index += 1) {
      key[index % 32] = (key[index % 32] + conversationId.charCodeAt(index)) % 255;
    }
    return key;
  }, [conversationId]);

  return { sessionKey };
}
