import { installAppCrypto } from '@/shared/crypto/install-crypto';
import { installTweetNaclPrng } from '@/shared/crypto/prng';

installAppCrypto();
installTweetNaclPrng();

import '@/styles/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerForPushNotifications, setupPushFromWebSocket, setupNotificationResponseListener } from '@/features/notifications/push';
import { runAppStartup } from '@/processes/app-startup';
import {
  AuthProvider,
  QueryProvider,
  ThemeProvider,
  ToastProvider,
  WebSocketProvider,
} from '@/providers';
import { I18nProvider } from '@/providers/i18n-provider';
import { useAiNotifications } from '@/entities/ai/use-ai-notifications';
import { useKeyboardBehavior } from '@/shared/hooks/use-keyboardBehavior';
import { ASYNC_STORAGE_KEYS, AsyncStorageService } from '@/shared/lib/storage';
import { KeyboardAvoidingView, ActivityIndicator, View, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library',
]);
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { initializeSqlite } from '@/shared/storage/sqlite';

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

    const stopResponseListener = setupNotificationResponseListener();
    let stopPush: () => void = () => { };

    // Resolve the current user ID so push notifications skip the sender
    AsyncStorageService.get<{ id: string }>(ASYNC_STORAGE_KEYS.USER_DATA)
      .then((user) => {
        try {
          stopPush = setupPushFromWebSocket(user?.id ?? '');
        } catch {
        }
      })
      .catch(() => { });

    return () => {
      stopPush();
      stopResponseListener();
    };
  }, []);

  return null;
}

/** Listens for AI response events and shows toast notifications when off-screen. */
function AiNotificationListener() {
  useAiNotifications();
  return null;
}

export default function RootLayout(): JSX.Element {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeSqlite()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setIsDbReady(true); // Fallback to allow app rendering
      });
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProviders>
            <AppTreeWithKeyboardAvoiding>
              <Stack screenOptions={{ headerShown: false }} initialRouteName='index' />
              <AppStartup />
              <AiNotificationListener />
            </AppTreeWithKeyboardAvoiding>
          </AppProviders>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}
