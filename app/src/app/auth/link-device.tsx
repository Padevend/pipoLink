import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LinkDeviceScreen(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center flex-1">
          {/* Bouton Retour Géométrique Mat */}
          <Pressable 
            onPress={() => router.back()} 
            className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={14} color="#71717A" />
          </Pressable>
          
          {/* Bloc Titre & Sous-titre Contextuel */}
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Associer cet appareil
            </Text>
            <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              Équipement secondaire sécurisé
            </Text>
          </View>
        </View>

        {/* Logo d'application net sur la droite */}
        <View>
          <AppLogo size="sm" />
        </View>
      </View>

      {/* Contenu principal / Panneau d'association */}
      <View className="flex-1 px-4 pt-4">
        <AssociateDevicePanel autoStart />
      </View>

    </SafeAreaView>
  );
}