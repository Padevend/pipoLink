import { createContext, type ReactNode, useEffect, useMemo, useState, useContext } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { wsManager } from '@/shared/websocket/manager';

interface WebSocketContextValue {
  status: string;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isLoggedIn } = useAuth();
  const [status, setStatus] = useState(wsManager.getStatus());

  useEffect(() => {
    if (isLoggedIn) {
      wsManager.connect();
    } else {
      wsManager.disconnect();
    }
    
    const unsubscribe = wsManager.on('status.change', (newStatus: string) => {
      setStatus(newStatus as any);
    });
    
    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [isLoggedIn]);

  const value = useMemo(() => ({
    status,
  }), [status]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
