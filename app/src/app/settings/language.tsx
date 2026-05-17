import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AppLanguage } from '@/i18n';
import { useLanguage } from '@/shared/hooks/use-language';
import { Header } from '@/shared/ui/header';
import { cn } from '@/shared/utils/cn';

const LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];

export default function LanguageScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('language')} showBack />
      <View className="gap-2 px-4 py-4">
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.id}
            onPress={() => void setLanguage(lang.id)}
            className={cn(
              'rounded-2xl px-4 py-4',
              language === lang.id ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
            )}
          >
            <Text className={cn('text-base font-bold', language === lang.id ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark')}>
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
