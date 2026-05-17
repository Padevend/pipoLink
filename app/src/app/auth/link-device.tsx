import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { AppLogo } from '@/shared/ui/app-logo';
import { ChevronLeft } from 'lucide-react-native';

export default function LinkDeviceScreen(): JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center gap-3 border-b border-border-light px-4 py-3 dark:border-border-dark">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <AppLogo size="sm" />
        <View className="flex-1">
          <Text className="text-lg font-black text-text-primary-light dark:text-text-primary-dark">
            Associer cet appareil
          </Text>
          <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Appareil secondaire
          </Text>
        </View>
      </View>
      <AssociateDevicePanel autoStart />
    </SafeAreaView>
  );
}
