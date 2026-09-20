import { router } from 'expo-router';
import { ArrowLeft, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>

      {/* HEADER : Néo-banque, Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Langue
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Préférences régionales
          </Text>
        </View>
      </View>

      {/* Liste des Langues disponibles */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Langue de l'application
        </Text>

        {/* Conteneur de liste (Arrondis 2xl, fond plein) */}
        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.id;

            return (
              <View key={lang.id}>
                {index > 0 && <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />}

                <Pressable
                  onPress={() => {
                    if (lang.isAvailable) {
                      void setLanguage(lang.id);
                    }
                  }}
                  disabled={!lang.isAvailable}
                  className={cn(
                    'flex-row items-center justify-between p-4 transition-opacity',
                    !lang.isAvailable && 'opacity-50'
                  )}
                >
                  {/* Bloc de Gauche : Icône + Libellés */}
                  <View className="flex-row items-center gap-4 flex-1 pr-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                      <Languages size={18} color={isSelected ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
                    </View>

                    <View className="flex-1 justify-center">
                      <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                        {lang.label}
                      </Text>
                      <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                        {lang.subLabel} {lang.isAvailable ? '' : '• Bientôt disponible'}
                      </Text>
                    </View>
                  </View>

                  {/* Bloc de Droite : Bouton Radio Géométrique (rounded-full) */}
                  {lang.isAvailable && (
                    <View className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                    )}>
                      {isSelected && (
                        <View className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}