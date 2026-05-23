import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Languages } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import type { AppLanguage } from '@/i18n';
import { useLanguage } from '@/shared/hooks/use-language';
import { cn } from '@/shared/utils/cn';
import { BRAND } from '@/shared/config/brand';

const LANGUAGES: { id: AppLanguage; label: string; subLabel: string }[] = [
  { id: 'fr', label: 'Français', subLabel: 'French' },
  { id: 'en', label: 'English', subLabel: 'Anglais' }
];

export default function LanguageScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Style Glassmorphism */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} color="#64748B" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {t('language')}
        </Text>
      </View>

      {/* Liste des Langues disponibles */}
      <View className="flex-1 px-5 py-6">
        <Text className="mb-3 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Langue de l'application
        </Text>

        {/* Conteneur unique en verre poli */}
        <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.id;

            return (
              <View key={lang.id}>
                {index > 0 && <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />}
                
                <Pressable
                  onPress={() => void setLanguage(lang.id)}
                  className="flex-row items-center justify-between px-4 py-4 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 transition-all active:scale-[0.99]"
                >
                  {/* Bloc de Gauche : Icône Globale/Langue + Libellés */}
                  <View className="flex-row items-center gap-3.5">
                    <View className={cn(
                      "h-9 w-9 items-center justify-center rounded-xl border",
                      isSelected 
                        ? "bg-primary/10 border-primary/20" 
                        : "bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10"
                    )}>
                      <Languages size={16} color={isSelected ? BRAND.primary : '#64748B'} />
                    </View>
                    
                    <View className="justify-center">
                      <Text className={cn(
                        'text-[14px] font-semibold tracking-tight',
                        isSelected ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'
                      )}>
                        {lang.label}
                      </Text>
                      <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/40 mt-0.5">
                        {lang.subLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Bloc de Droite : Anneau Radio Customisé */}
                  <View className={cn(
                    'h-5 w-5 items-center justify-center rounded-full border transition-all',
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border-light/60 dark:border-border-dark/40 bg-transparent'
                  )}>
                    {isSelected && (
                      <View className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}