import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { getJson, setJson } from '@/shared/storage/async-storage';
import { Header } from '@/shared/ui/header';

export default function NotificationsScreen(): JSX.Element {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void getJson('notifications_enabled', true).then(setEnabled);
  }, []);

  const toggle = async (value: boolean): Promise<void> => {
    setEnabled(value);
    await setJson('notifications_enabled', value);
  };

  return (
    <View className="flex-1 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <Header title="Notifications" subtitle="Préférences globales" />
      <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-900 dark:text-white">Activer les notifications</Text>
          <Switch value={enabled} onValueChange={(value) => void toggle(value)} />
        </View>
      </View>
    </View>
  );
}
