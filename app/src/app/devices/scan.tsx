
import { useCameraPermissions, CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useLinkDevice } from '@/features/devices/hooks/use-link-device';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function DeviceScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState('');
  const linkMutation = useLinkDevice();

  const handleLink = async (qrToken: string): Promise<void> => {
    if (!qrToken.trim()) {
      return;
    }

    await linkMutation.mutateAsync(qrToken);
    router.push({ pathname: '/modal/device-confirm', params: { qrToken, name: 'Nouvel appareil' } });
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Scanner QR" subtitle="Ajout d’un appareil" />
      <View className="flex-1 gap-4 p-4">
        {!permission?.granted ? (
          <Button label="Autoriser la caméra" onPress={() => void requestPermission()} />
        ) : (
          <View className="flex-1 overflow-hidden rounded-3xl bg-black">
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(event) => {
                if (event.data) {
                  setToken(event.data);
                }
              }}
            />
          </View>
        )}
        <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
          <Text className="mb-2 text-sm text-slate-500">Coller un QR token</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="Coller un QR token"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 dark:border-slate-700 dark:text-white"
          />
          <Button label="Lier l’appareil" loading={linkMutation.isPending} onPress={() => void handleLink(token)} />
        </View>
      </View>
    </View>
  );
}
