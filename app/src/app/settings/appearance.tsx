import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/shared/hooks/use-theme';
import { cn } from '@/shared/utils/cn';
import { BRAND } from '@/shared/config/brand';

export default function AppearanceScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const { mode, setMode } = useTheme();

  const options = [
    { id: 'light' as const, label: 'Clair', icon: Sun },
    { id: 'dark' as const, label: 'Sombre', icon: Moon },
    { id: 'system' as const, label: 'Système', icon: Monitor },
  ];

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
          {t('appearance')}
        </Text>
      </View>

      {/* Liste des Options d'Apparence */}
      <View className="flex-1 px-5 py-6">
        <Text className="mb-3 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Mode d'affichage
        </Text>

        <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
          {options.map((item, index) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;

            return (
              <View key={item.id}>
                {index > 0 && <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />}
                
                <Pressable
                  onPress={() => setMode(item.id)}
                  className="flex-row items-center justify-between px-4 py-4 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 transition-all active:scale-[0.99]"
                >
                  {/* Bloc de Gauche : Icône + Label */}
                  <View className="flex-row items-center gap-3.5">
                    <View className={cn(
                      "h-9 w-9 items-center justify-center rounded-xl border",
                      isSelected 
                        ? "bg-primary/10 border-primary/20" 
                        : "bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10"
                    )}>
                      <Icon size={16} color={isSelected ? BRAND.primary : '#64748B'} />
                    </View>
                    
                    <Text className={cn(
                      'text-[14px] font-semibold tracking-tight',
                      isSelected ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'
                    )}>
                      {item.label}
                    </Text>
                  </View>

                  {/* Bloc de Droite : Bouton Radio Customisé */}
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