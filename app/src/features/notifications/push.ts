import { Platform } from 'react-native';

import { getJson, setJson } from '@/shared/storage/async-storage';
import { WS_EVENTS } from '@/shared/constants/ws-events';
import { on } from '@/shared/websocket/manager';

const ENABLED_KEY = 'notifications_enabled';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;

/** Expo Go (SDK 53+) ne supporte plus les push distantes Android — éviter le chargement du module natif. */
function isExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as { appOwnership?: string };
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (isExpoGo()) {
    notificationsModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
    if (!handlerConfigured && notificationsModule) {
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] expo-notifications unavailable:', e);
    }
    notificationsModule = null;
  }

  return notificationsModule;
}

export function arePushNotificationsSupported(): boolean {
  return getNotifications() !== null;
}

export async function isPushEnabled(): Promise<boolean> {
  return getJson(ENABLED_KEY, true);
}

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !(await isPushEnabled())) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PipoLink',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Token distant : development build uniquement (pas Expo Go)
    if (!isExpoGo()) {
      const token = await Notifications.getExpoPushTokenAsync().catch(() => null);
      return token?.data ?? null;
    }
    return null;
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] registerForPushNotifications failed:', e);
    }
    return null;
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !(await isPushEnabled())) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] showLocalNotification failed:', e);
    }
  }
}

export function setupPushFromWebSocket(): () => void {
  const unsubs = [
    on<{ conversationId: string }>(WS_EVENTS.MESSAGE_CREATED, async () => {
      await showLocalNotification('PipoLink', 'New message received');
    }),
    on(WS_EVENTS.NOTIFICATION_CREATED, async () => {
      await showLocalNotification('PipoLink', 'You have a new notification');
    }),
    on<{ title?: string }>(WS_EVENTS.ANNOUNCEMENT_CREATED, async (payload) => {
      await showLocalNotification(
        'Nouvelle annonce',
        typeof payload?.title === 'string' ? payload.title : 'Une annonce a été publiée',
      );
    }),
    on(WS_EVENTS.DEVICE_LINKED, async () => {
      await showLocalNotification('PipoLink', 'A new device was linked to your account');
    }),
  ];
  return () => unsubs.forEach((u) => u());
}

export async function setPushEnabled(enabled: boolean): Promise<void> {
  await setJson(ENABLED_KEY, enabled);
  if (enabled) {
    await registerForPushNotifications();
  }
}
