import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Header } from '@/shared/ui/header';

export default function SubscriptionScreen(): JSX.Element {
  const { t } = useTranslation('settings');

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('subscription')} showBack />
      <View className="gap-4 px-4 py-4">
        <Card className="p-5">
          <Text className="text-lg font-black text-text-primary-light dark:text-text-primary-dark">{t('planFree')}</Text>
          <Text className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            20 AI messages / day • Standard library access
          </Text>
        </Card>
        <Card className="border border-primary/30 p-5">
          <Text className="text-lg font-black text-primary">{t('planPremium')}</Text>
          <Text className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Unlimited AI • Priority sync • Advanced library
          </Text>
          <Button label="Upgrade (soon)" variant="primary" className="mt-4" onPress={() => undefined} disabled />
        </Card>
      </View>
    </SafeAreaView>
  );
}
