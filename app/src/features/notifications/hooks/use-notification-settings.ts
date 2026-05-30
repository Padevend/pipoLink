import { useCallback, useEffect, useState } from 'react';

import { AsyncStorageService, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';

import {
  DEFAULT_CHANNEL_SETTINGS,
  type NotificationChannelSettings,
} from '../types';

const KEY = ASYNC_STORAGE_KEYS.NOTIFICATION_CHANNEL_SETTINGS;

/**
 * React hook that manages notification channel settings with AsyncStorage persistence.
 *
 * - On mount, loads saved settings (or falls back to defaults).
 * - Exposes `updateSettings` to merge partial updates, persist, and refresh state.
 * - Exposes `resetSettings` to restore factory defaults.
 */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationChannelSettings>(DEFAULT_CHANNEL_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ── Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorageService.get<NotificationChannelSettings>(KEY);
      if (stored) {
        // Merge with defaults so new keys introduced later always have a value
        setSettings({ ...DEFAULT_CHANNEL_SETTINGS, ...stored });
      }
      setLoading(false);
    })();
  }, []);

  // ── Update (partial merge) ──────────────────────────────────────────
  const updateSettings = useCallback(
    async (patch: Partial<NotificationChannelSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        // Fire-and-forget persistence
        void AsyncStorageService.set(KEY, next);
        return next;
      });
    },
    [],
  );

  // ── Reset to factory defaults ───────────────────────────────────────
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_CHANNEL_SETTINGS);
    await AsyncStorageService.set(KEY, DEFAULT_CHANNEL_SETTINGS);
  }, []);

  return { settings, loading, updateSettings, resetSettings } as const;
}
