import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LinkDeviceScreen(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      
      {/* En-tête Translucide Style Glassmorphism Lumineux (Sans Shadow) */}
      <View className="z-10 flex-row items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-3.5 backdrop-blur-xl">
        <View className="flex-row items-center flex-1">
          {/* Bouton Retour Épuré Capsulaire */}
          <Pressable 
            onPress={() => router.back()} 
            className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} color="#64748B" />
          </Pressable>
          
          {/* Conteneur Titre & Sous-titre Contextuel */}
          <View className="ml-3.5 flex-1">
            <Text className="text-[16px] font-bold tracking-tight text-slate-800">
              Associer cet appareil
            </Text>
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
              Équipement secondaire sécurisé
            </Text>
          </View>
        </View>

        {/* Logo d'application équilibré sur la droite */}
        <View className="opacity-90">
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