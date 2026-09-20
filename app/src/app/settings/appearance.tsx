import { router } from 'expo-router';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/hooks/use-theme';
import { cn } from '@/shared/utils/cn';

export default function AppearanceScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();

  const options = [
    { id: 'light' as const, label: 'Clair', icon: Sun },
    { id: 'dark' as const, label: 'Sombre', icon: Moon },
    { id: 'system' as const, label: 'Système', icon: Monitor },
  ];

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
            Apparence
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Thème & Affichage
          </Text>
        </View>
      </View>

      {/* Liste des Options d'Apparence */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Mode d'affichage
        </Text>

        {/* Conteneur de liste (Arrondis 2xl, fond plein) */}
        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          {options.map((item, index) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;

            return (
              <View key={item.id}>
                {index > 0 && <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />}
                
                <Pressable
                  onPress={() => setMode(item.id)}
                  className="flex-row items-center justify-between p-4 active:opacity-80 transition-opacity"
                >
                  {/* Bloc de Gauche : Icône + Label */}
                  <View className="flex-row items-center gap-4">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                      <Icon size={18} color={isSelected ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
                    </View>
                    
                    <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                      {item.label}
                    </Text>
                  </View>

                  {/* Bouton Radio Géométrique (rounded-full) */}
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
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}