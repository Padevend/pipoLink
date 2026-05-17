import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/hooks/use-theme';
import { Header } from '@/shared/ui/header';
import { cn } from '@/shared/utils/cn';

export default function AppearanceScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { mode, setMode } = useTheme();

  const options = [
    { id: 'light' as const, label: 'Light' },
    { id: 'dark' as const, label: 'Dark' },
    { id: 'system' as const, label: 'System' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('appearance')} showBack />
      <View className="gap-2 px-4 py-4">
        {options.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setMode(item.id)}
            className={cn(
              'rounded-2xl px-4 py-4',
              mode === item.id ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
            )}
          >
            <Text className={cn('font-bold', mode === item.id ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark')}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
