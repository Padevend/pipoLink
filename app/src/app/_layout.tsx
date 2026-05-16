import { installTweetNaclPrng } from '@/shared/crypto/prng';
installTweetNaclPrng();

import "@/styles/global.css";
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runAppStartup } from '@/processes/app-startup';
import { AuthProvider, QueryProvider, ThemeProvider, ToastProvider, WebSocketProvider } from '@/providers';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout(): JSX.Element {
  useEffect(() => {
    void runAppStartup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
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
                  </Stack>
                </WebSocketProvider>
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
