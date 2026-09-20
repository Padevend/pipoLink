import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LinkDeviceScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-6 py-4">
        <View className="flex-row items-center flex-1 gap-4">
          <Pressable 
            onPress={() => router.back()} 
            className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
          </Pressable>
          
          <View className="flex-1">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
              Associer l'appareil
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
              Équipement secondaire
            </Text>
          </View>
        </View>

        <View>
          <AppLogo size="sm" />
        </View>
      </View>

      <View
        className="flex-1 pt-6 px-6"
        style={{
          paddingBottom: Math.max(insets.bottom + 24, 32),
        }}
      >
        <AssociateDevicePanel autoStart />
      </View>
    </SafeAreaView>
  );
}