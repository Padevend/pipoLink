import { APP_CONFIG } from '@/shared/config/app';
import { ASYNC_STORAGE_KEYS, AsyncStorageService } from '@/shared/lib/storage';
import * as WebBrowser from 'expo-web-browser';
import { CalendarPlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

export const TICKY_URL = APP_CONFIG.links.ticky_brand;

export function useEventCardDismissed() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorageService.get<boolean>(ASYNC_STORAGE_KEYS.EVENT_CARD_DISMISSED).then((v) =>
      setDismissed(v === true),
    );
  }, []);

  const dismiss = () => {
    setDismissed(true);
    void AsyncStorageService.set(ASYNC_STORAGE_KEYS.EVENT_CARD_DISMISSED, true);
  };

  return { dismissed, dismiss };
}

export function EventPromoCard({ canDismissed = true }: { canDismissed?: Boolean }) {
  const { dismissed, dismiss } = useEventCardDismissed();

  if (dismissed !== false) return null;

  const openTicky = () => {
    WebBrowser.openBrowserAsync(TICKY_URL).catch(() => { });
  };

  return (
    <View className="mx-6 mt-3 mb-1 rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10 overflow-hidden">
      <Pressable onPress={openTicky} className="flex-row items-center gap-3 p-4 active:opacity-80">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
          <CalendarPlus size={20} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Créer un événement
          </Text>
          <Text
            className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
            numberOfLines={1}
          >
            Organisez et publiez vos événements avec Ticky
          </Text>
        </View>

        {canDismissed && (
          <Pressable
            onPress={dismiss}
            hitSlop={10}
            className="h-7 w-7 items-center justify-center rounded-full active:bg-orange-100 dark:active:bg-orange-500/20"
          >
            <X size={14} color="#a1a1aa" />
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}
