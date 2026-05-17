import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DeviceItem } from '@/features/devices/components/device-item';
import { useIsPrimaryDevice } from '@/features/devices/hooks/use-is-primary-device';
import { useDevices } from '@/features/devices/hooks/use-devices';
import { useRemoveDevice } from '@/features/devices/hooks/use-remove-device';
import { Header } from '@/shared/ui/header';
import { Loader } from '@/shared/ui/loader';

export default function DevicesScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { data, isLoading } = useDevices();
  const { data: isPrimary, isLoading: checkingPrimary } = useIsPrimaryDevice();
  const removeMutation = useRemoveDevice();

  const secondaryDevices = (data ?? []).filter((d) => !d.isPrimary);

  if (checkingPrimary) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <Loader />
      </SafeAreaView>
    );
  }

  if (!isPrimary) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <Header title={t('linkedDevices')} showBack />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-text-secondary-light dark:text-text-secondary-dark">
            {t('primaryOnly')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1">
        <Header
          title={t('linkedDevices')}
          subtitle={t('linkedDevicesDesc')}
          showBack
          rightActions={
            <Pressable
              onPress={() => router.push('/devices/scan')}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
            >
              <Plus size={18} color="#FF7A00" />
            </Pressable>
          }
        />
        <View className="px-4 py-2">
          {isLoading ? <Loader /> : null}
          {secondaryDevices.map((device) => (
            <DeviceItem
              key={device.id}
              device={device}
              onRemove={() => void removeMutation.mutateAsync(device.id)}
            />
          ))}
          {!isLoading && secondaryDevices.length === 0 ? (
            <Text className="py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
              Aucun appareil secondaire lié.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
