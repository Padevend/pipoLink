import { installAppCrypto } from '@/shared/crypto/install-crypto';
import { installTweetNaclPrng } from '@/shared/crypto/prng';

installAppCrypto();
installTweetNaclPrng();

import '@/styles/global.css';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runAppStartup } from '@/processes/app-startup';
import { registerForPushNotifications, setupPushFromWebSocket } from '@/features/notifications/push';
import {
  AuthProvider,
  QueryProvider,
  ThemeProvider,
  ToastProvider,
  WebSocketProvider,
} from '@/providers';
import { I18nProvider } from '@/providers/i18n-provider';
import { useKeyboardBehavior } from '@/shared/hooks/use-keyboardBehavior';
import { KeyboardAvoidingView } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <AppTreeWithKeyboardAvoiding>
      <ThemeProvider>
        <I18nProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <WebSocketProvider>{children}</WebSocketProvider>
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </I18nProvider>
      </ThemeProvider>
    </AppTreeWithKeyboardAvoiding>
  );
}

function AppTreeWithKeyboardAvoiding({ children }: { children: React.ReactNode }): JSX.Element {
  const behaviour = useKeyboardBehavior();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "transparent" }}
      behavior={behaviour}
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export default function RootLayout(): JSX.Element {
  useEffect(() => {
    void runAppStartup();
    void registerForPushNotifications().catch(() => undefined);
    let stopPush: () => void = () => { };
    try {
      stopPush = setupPushFromWebSocket();
    } catch {
      // WebSocket listeners optional at boot
    }
    return () => stopPush();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }} >
            <Stack.Screen name="index" />
            <Stack.Screen name="devices/index" />
          </Stack>
        </AppProviders>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
