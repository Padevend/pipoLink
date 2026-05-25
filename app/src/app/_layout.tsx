import { installAppCrypto } from '@/shared/crypto/install-crypto';
import { installTweetNaclPrng } from '@/shared/crypto/prng';

installAppCrypto();
installTweetNaclPrng();

import '@/styles/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerForPushNotifications, setupPushFromWebSocket } from '@/features/notifications/push';
import { runAppStartup } from '@/processes/app-startup';
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
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return (
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
  );
}

const AppTreeWithKeyboardAvoiding = React.memo(({ children }: { children: React.ReactNode }): JSX.Element => {
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
});

// startApp
function AppStartup() {
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

  return null;
}

export default function RootLayout(): JSX.Element {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProviders>
            <AppTreeWithKeyboardAvoiding>
              <Stack screenOptions={{ headerShown: false }} initialRouteName='index' />
              <AppStartup />
            </AppTreeWithKeyboardAvoiding>
          </AppProviders>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}
