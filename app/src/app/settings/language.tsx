import { router } from 'expo-router';
import { ArrowLeft, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppLanguage } from '@/i18n';
import { useLanguage } from '@/shared/hooks/use-language';
import { cn } from '@/shared/utils/cn';

const LANGUAGES: { id: AppLanguage; label: string; subLabel: string; isAvailable: boolean }[] = [
  { id: 'fr', label: 'Français', subLabel: 'French', isAvailable: true },
  { id: 'en', label: 'English', subLabel: 'Anglais', isAvailable: false }
];

export default function LanguageScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Langue
        </Text>
      </View>

      {/* Liste des Langues disponibles */}
      <View className="flex-1 px-4 py-5">
        <Text className="mb-2 ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Langue de l'application
        </Text>

        {/* Conteneur de liste opaque mat */}
        <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.id;

            return (
              <View key={lang.id}>
                {index > 0 && <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />}

                <Pressable
                  onPress={() => {
                    if (lang.isAvailable) {
                      void setLanguage(lang.id);
                    }
                  }}
                  className={cn(
                    'flex-row items-center justify-between px-4 py-3.5 transition-colors',
                    isSelected
                      ? 'bg-orange-50/20 dark:bg-orange-950/5'
                      : 'active:bg-zinc-50 dark:active:bg-zinc-900/50',
                    !lang.isAvailable && 'opacity-50'
                  )}
                >
                  {/* Bloc de Gauche : Icône + Libellés */}
                  <View className="flex-row items-center gap-3">
                    <View className={cn(
                      "h-8 w-8 items-center justify-center rounded-lg border",
                      isSelected
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50"
                        : "bg-zinc-50 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800"
                    )}>
                      <Languages size={14} color={isSelected ? '#F97316' : '#71717A'} />
                    </View>

                    <View className="justify-center">
                      <Text className={cn(
                        'text-xs font-semibold tracking-tight',
                        isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-50'
                      )}>
                        {lang.label}
                      </Text>
                      <Text className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {lang.subLabel} {lang.isAvailable ? '' : ' (bientôt disponible)'}
                      </Text>
                    </View>
                  </View>

                  {/* Bloc de Droite : Bouton Radio Géométrique Customisé */}
                  {lang.isAvailable && (
                    <View className={cn(
                      'h-4 w-4 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                    )}>
                      {isSelected && (
                        <View className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}