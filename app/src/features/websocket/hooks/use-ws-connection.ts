import { useContext } from 'react';

import { WebSocketContext } from '@/providers';

export function useWsConnection() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWsConnection must be used within WebSocketProvider');
  }

  return context;
}
