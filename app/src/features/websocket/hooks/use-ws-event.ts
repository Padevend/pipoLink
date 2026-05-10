import { useEffect } from 'react';

import { on } from '@/shared/websocket/manager';

export function useWsEvent<T>(event: string, handler: (payload: T) => void): void {
  useEffect(() => on<T>(event, handler), [event, handler]);
}
