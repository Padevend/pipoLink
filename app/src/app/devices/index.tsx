import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DeviceItem } from '@/features/devices/components/device-item';
import { useDevices } from '@/features/devices/hooks/use-devices';
import { useRemoveDevice } from '@/features/devices/hooks/use-remove-device';
import { Header } from '@/shared/ui/header';
import { Loader } from '@/shared/ui/loader';

export default function DevicesScreen(): JSX.Element {
  const { data, isLoading } = useDevices();
  const removeMutation = useRemoveDevice();

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header
        title="Appareils connectés"
        subtitle="Gestion de la confiance multi-device"
        rightActions={
          <Pressable onPress={() => router.push('/devices/scan')} className="rounded-full bg-white p-2 dark:bg-slate-900">
            <Plus size={18} color="#334155" />
          </Pressable>
        }
      />
      <View className="px-4 py-4">
        {isLoading ? <Loader /> : null}
        {data?.map((device) => (
          <DeviceItem key={device.id} device={device} onRemove={device.isPrimary ? undefined : () => void removeMutation.mutateAsync(device.id)} />
        ))}
        {!isLoading && (data?.length ?? 0) === 0 ? <Text className="text-slate-500">Aucun appareil lié.</Text> : null}
      </View>
    </ScrollView>
  );
}
