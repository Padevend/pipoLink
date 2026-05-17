import { installAppCrypto } from '@/shared/crypto/install-crypto';
import { installTweetNaclPrng } from '@/shared/crypto/prng';

installAppCrypto();
installTweetNaclPrng();

import "@/styles/global.css";
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runAppStartup } from '@/processes/app-startup';
import { registerForPushNotifications, setupPushFromWebSocket } from '@/features/notifications/push';
import { AuthProvider, QueryProvider, ThemeProvider, ToastProvider, WebSocketProvider } from '@/providers';
import { I18nProvider } from '@/providers/i18n-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout(): JSX.Element {
  useEffect(() => {
    void runAppStartup();
    void registerForPushNotifications().catch(() => undefined);
    let stopPush: () => void = () => {};
    try {
      stopPush = setupPushFromWebSocket();
    } catch {
      // WebSocket listeners optional at boot
    }
    return () => stopPush();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
      <SafeAreaProvider>
        <I18nProvider>
        
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <WebSocketProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="chat/[id]" />
                    <Stack.Screen name="devices/index" />
                    <Stack.Screen name="devices/scan" />
                    <Stack.Screen name="devices/add" />
                    <Stack.Screen name="devices/key-recovery" />
                    <Stack.Screen name="updates/changelog" />
                    <Stack.Screen name="modal/upload-file" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="modal/upload-document" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="modal/device-confirm" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="modal/update-available" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="settings/device-qr" />
                    <Stack.Screen name="settings/profile" />
                    <Stack.Screen name="settings/language" />
                    <Stack.Screen name="settings/subscription" />
                    <Stack.Screen name="settings/appearance" />
                    <Stack.Screen name="settings/notifications" />
                    <Stack.Screen name="settings/about" />
                    <Stack.Screen name="messaging/new" />
                    <Stack.Screen name="messaging/new-group" />
                    <Stack.Screen name="announcements/index" />
                    <Stack.Screen name="announcements/new" />
                  </Stack>
                </WebSocketProvider>
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </I18nProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
