import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrepareDeviceQr } from '@/features/devices/hooks/use-prepare-device-qr';
import { AppLogo } from '@/shared/ui/app-logo';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function DeviceQrSettingsScreen(): JSX.Element {
  const prepare = usePrepareDeviceQr();

  useEffect(() => {
    prepare.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const json = prepare.data ? JSON.stringify(prepare.data) : '';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title="Code QR appareil" subtitle="À scanner depuis votre appareil principal" />
      <View className="flex-1 items-center gap-6 p-6">
        <AppLogo size="sm" />
        {prepare.isPending ? (
          <ActivityIndicator size="large" color="#FF7A00" />
        ) : prepare.data ? (
          <View className="rounded-3xl bg-white p-6 shadow-lg dark:bg-surface-dark">
            <QRCode value={json} size={240} />
          </View>
        ) : (
          <Text className="text-center text-error">Impossible de générer le QR.</Text>
        )}
        <Text className="px-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Affichez ce code sur cet appareil secondaire, puis scannez-le depuis l&apos;appareil principal (Paramètres → Appareils liés).
        </Text>
        <Button label="Régénérer le code" variant="outline" loading={prepare.isPending} onPress={() => prepare.mutate()} />
      </View>
    </SafeAreaView>
  );
}
