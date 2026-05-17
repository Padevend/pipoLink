import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { AppLogo } from '@/shared/ui/app-logo';
import { Card } from '@/shared/ui/card';
import { Header } from '@/shared/ui/header';

export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('about')} showBack />
      <View className="items-center px-4 py-8">
        <AppLogo size="lg" showWordmark />
        <Card className="mt-8 w-full p-5">
          <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
            {t('version', { version })}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
            PipoLink is a secure, offline-first academic messaging platform with end-to-end encryption and multi-device support.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}
