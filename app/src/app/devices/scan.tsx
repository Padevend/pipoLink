import { router } from 'expo-router';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useLinkDevice } from '@/features/devices/hooks/use-link-device';
import { parseDeviceQrPayload, verifyDeviceQrPayloadSignature } from '@/features/devices/lib/verify-qr-payload';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function DeviceScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState('');
  const [scanned, setScanned] = useState(false);
  const linkMutation = useLinkDevice();
  const { showToast } = useToast();
  const linkingRef = useRef(false);

  const handleLink = useCallback(async (raw: string): Promise<void> => {
    const trimmed = raw.trim();
    if (!trimmed || linkingRef.current) return;

    const parsed = parseDeviceQrPayload(trimmed);
    if (!parsed) {
      showToast({ type: 'error', message: 'QR invalide : format JSON attendu.' });
      return;
    }
    if (!verifyDeviceQrPayloadSignature(parsed)) {
      showToast({ type: 'error', message: 'QR invalide : signature incorrecte.' });
      return;
    }

    linkingRef.current = true;
    try {
      await linkMutation.mutateAsync(parsed);
      showToast({ type: 'success', message: 'Appareil lié. Les clés de chat ont été redistribuées.' });
      router.replace('/devices' as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec de la liaison.';
      showToast({ type: 'error', message: msg });
      setScanned(false);
      linkingRef.current = false;
    }
  }, [linkMutation, showToast]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Scanner QR" subtitle="Ajout d’un appareil (appareil principal)" />
      <View className="flex-1 gap-4 p-4">
        {!permission?.granted ? (
          <Button label="Autoriser la caméra" onPress={() => void requestPermission()} />
        ) : (
          <View className="flex-1 overflow-hidden rounded-3xl bg-black">
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(event) => {
                if (event.data && !scanned && !linkMutation.isPending) {
                  setScanned(true);
                  setToken(event.data);
                  void handleLink(event.data);
                }
              }}
            />
          </View>
        )}
        <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
          <Text className="mb-2 text-sm text-slate-500">Coller le JSON du nouvel appareil</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="JSON du QR"
            multiline
            className="min-h-[80px] rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 dark:border-slate-700 dark:text-white"
          />
          <Button label="Lier l’appareil" loading={linkMutation.isPending} onPress={() => void handleLink(token)} />
        </View>
      </View>
    </View>
  );
}
