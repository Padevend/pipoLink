/**
 * Mirrors `expo-notifications` AndroidImportance without requiring the native module.
 * Used for local persistence & UI, then mapped back when applying the channel.
 */
export enum AndroidImportance {
  UNKNOWN = 0,
  UNSPECIFIED = 1,
  NONE = 2,
  MIN = 3,
  LOW = 4,
  DEFAULT = 5,
  /** Heads-up notifications */
  HIGH = 6,
  MAX = 7,
}

/**
 * Mirrors `expo-notifications` AndroidNotificationVisibility.
 */
export enum AndroidNotificationVisibility {
  UNKNOWN = 0,
  PUBLIC = 1,
  PRIVATE = 2,
  SECRET = 3,
}

/**
 * Represents the full set of configurable options for an Android notification channel.
 * Persisted locally via AsyncStorage.
 */
export interface NotificationChannelSettings {
  id: string;
  name: string | null;
  importance: AndroidImportance;
  bypassDnd: boolean;
  lightColor: string;
  lockscreenVisibility: AndroidNotificationVisibility;
  sound: 'default' | 'custom' | null;
  vibrationPattern: number[] | null;
  enableLights: boolean;
  enableVibrate: boolean;
}

/** Sensible defaults matching the current hard-coded channel in push.ts */
export const DEFAULT_CHANNEL_SETTINGS: NotificationChannelSettings = {
  id: 'default',
  name: 'PipoLink',
  importance: AndroidImportance.MAX,
  bypassDnd: false,
  lightColor: '#FF7A00',
  lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250],
  enableLights: true,
  enableVibrate: true,
};
