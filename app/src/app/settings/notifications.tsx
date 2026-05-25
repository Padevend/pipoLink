import { ArrowLeft, BellRing } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isPushEnabled, registerForPushNotifications, setPushEnabled } from '@/features/notifications/push';
import { BRAND } from '@/shared/config/brand';
import { router } from 'expo-router';

export default function NotificationsScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void isPushEnabled().then(setEnabled);
    void registerForPushNotifications();
  }, []);

  const toggle = async (value: boolean): Promise<void> => {
    setEnabled(value);
    await setPushEnabled(value);
    if (value) await registerForPushNotifications();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Pur - Style Glassmorphism sans ombrage */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Notifications
        </Text>
      </View>

      {/* Zone de Contenu */}
      <View className="flex-1 px-5 py-6">
        <Text className="mb-3 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Alertes système
        </Text>

        {/* Capsule Satinée Unique - Contours affinés sans shadow */}
        <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md flex-row items-center justify-between">
          
          {/* Bloc de Gauche : Icône Cloche + Textes explicatifs */}
          <View className="flex-row items-start flex-1 pr-4 gap-3.5">
            <View className={`h-9 w-9 items-center justify-center rounded-xl border ${
              enabled 
                ? 'bg-primary/10 border-primary/20' 
                : 'bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10'
            }`}>
              <BellRing size={16} color={enabled ? BRAND.primary : '#64748B'} />
            </View>

            <View className="flex-1 justify-center">
              <Text className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Push notifications
              </Text>
              <Text className="mt-1 text-[11px] font-medium leading-[16px] text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                New messages and important alerts when the app is closed
              </Text>
            </View>
          </View>

          {/* Commutateur Switch de couleur unifiée */}
          <Switch 
            value={enabled} 
            onValueChange={(v) => void toggle(v)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}