import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { isPushEnabled, registerForPushNotifications, setPushEnabled } from '@/features/notifications/push';
import { Header } from '@/shared/ui/header';

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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('notifications')} showBack />
      <View className="mx-4 rounded-3xl bg-surface-light p-4 dark:bg-surface-dark">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">Push notifications</Text>
            <Text className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              New messages and important alerts when the app is closed
            </Text>
          </View>
          <Switch value={enabled} onValueChange={(v) => void toggle(v)} trackColor={{ true: '#FF7A00' }} />
        </View>
      </View>
    </SafeAreaView>
  );
}
