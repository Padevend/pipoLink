import { createContext, type ReactNode, useEffect, useMemo, useState, useContext, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { wsManager } from '@/shared/websocket/manager';
import { WS_EVENTS } from '@/shared/constants/ws-events';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

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
  const { isLoggedIn, logout, refreshUser } = useAuth();
  const [status, setStatus] = useState(wsManager.getStatus());
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  useEffect(() => {
    if (isLoggedIn) {
      wsManager.connect();
    } else {
      wsManager.disconnect();
    }
    
    const unsubscribeStatus = wsManager.on('status.change', (newStatus: string) => {
      setStatus(newStatus as any);
    });

    /**
     * Handler for device.revoked — spec §6 (WebSocket révocation en temps réel).
     *
     * When the server revokes this device (manually or via key recovery),
     * we immediately purge all local credentials and redirect to login.
     * This fires even if the app is actively used — no waiting for next refresh.
     */
    const unsubscribeRevoked = wsManager.on<{ deviceId: string }>(
      WS_EVENTS.DEVICE_REVOKED,
      async (payload) => {
        const currentDeviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);

        // Only act if the revoked device matches ours (or if no deviceId filter)
        if (currentDeviceId && payload?.deviceId && payload.deviceId !== currentDeviceId) {
          return;
        }

        // 1. Purge local secure storage (private keys, tokens)
        await SecureStorageService.remove(SECURE_STORAGE_KEYS.IDENTITY_PRIVATE_KEY);
        await SecureStorageService.remove(SECURE_STORAGE_KEYS.IDENTITY_SIGNING_PRIVATE_KEY);
        await SecureStorageService.remove(SECURE_STORAGE_KEYS.IDENTITY_PUBLIC_KEY);

        // 2. Disconnect WebSocket
        wsManager.disconnect();

        // 3. Logout (clears auth tokens + user data)
        await logoutRef.current();

        // 4. Force redirect to login with explicit message
        Alert.alert(
          'Appareil révoqué',
          'Cet appareil a été déconnecté de votre compte. Veuillez vous reconnecter si nécessaire.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login' as any) }],
        );
      },
    );
    
    // Mise à jour instantanée du plan après un paiement confirmé
    const unsubscribeSubscription = wsManager.on(WS_EVENTS.SUBSCRIPTION_UPDATED, () => {
      void refreshUserRef.current().catch(() => undefined);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeRevoked();
      unsubscribeSubscription();
      wsManager.disconnect();
    };
  }, [isLoggedIn]);

  const value = useMemo(() => ({
    status,
  }), [status]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
