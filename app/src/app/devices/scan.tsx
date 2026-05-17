import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApproveByCode } from '@/features/devices/hooks/use-approve-by-code';
import { useLinkDevice } from '@/features/devices/hooks/use-link-device';
import { parseDeviceQrPayload, verifyDeviceQrPayloadSignature } from '@/features/devices/lib/verify-qr-payload';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import { cn } from '@/shared/utils/cn';

type Tab = 'scan' | 'code';

export default function DeviceScanScreen() {
  const [tab, setTab] = useState<Tab>('scan');
  const [permission, requestPermission] = useCameraPermissions();
  const [shortCode, setShortCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const linkMutation = useLinkDevice();
  const codeMutation = useApproveByCode();
  const { showToast } = useToast();
  const linkingRef = useRef(false);

  const handleLinkQr = useCallback(
    async (raw: string): Promise<void> => {
      const trimmed = raw.trim();
      if (!trimmed || linkingRef.current) return;

      const parsed = parseDeviceQrPayload(trimmed);
      if (!parsed) {
        showToast({ type: 'error', message: 'QR invalide.' });
        return;
      }
      if (!verifyDeviceQrPayloadSignature(parsed)) {
        showToast({ type: 'error', message: 'Signature invalide.' });
        return;
      }

      linkingRef.current = true;
      try {
        await linkMutation.mutateAsync(parsed);
        showToast({ type: 'success', message: 'Appareil secondaire approuvé.' });
        router.replace('/devices' as any);
      } catch (e: unknown) {
        showToast({ type: 'error', message: e instanceof Error ? e.message : 'Échec de l\'approbation.' });
        setScanned(false);
        linkingRef.current = false;
      }
    },
    [linkMutation, showToast],
  );

  const handleApproveCode = async () => {
    try {
      await codeMutation.mutateAsync(shortCode);
      showToast({ type: 'success', message: 'Appareil associé via le code.' });
      router.replace('/devices' as any);
    } catch (e: unknown) {
      showToast({ type: 'error', message: e instanceof Error ? e.message : 'Code invalide ou expiré.' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title="Approuver un appareil" subtitle="Appareil principal uniquement" />
      <View className="flex-row gap-2 px-4 pb-2">
        <Button
          label="Scanner QR"
          variant={tab === 'scan' ? 'primary' : 'outline'}
          size="sm"
          className="flex-1"
          onPress={() => setTab('scan')}
        />
        <Button
          label="Code manuel"
          variant={tab === 'code' ? 'primary' : 'outline'}
          size="sm"
          className="flex-1"
          onPress={() => setTab('code')}
        />
      </View>

      <View className="flex-1 gap-4 p-4">
        {tab === 'scan' ? (
          <>
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
                      void handleLinkQr(event.data);
                    }
                  }}
                />
              </View>
            )}
          </>
        ) : (
          <View className={cn('flex-1 rounded-3xl bg-surface-light p-6 dark:bg-surface-dark')}>
            <Text className="mb-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Saisissez le code affiché sur l&apos;appareil secondaire
            </Text>
            <TextInput
              value={shortCode}
              onChangeText={(t) => setShortCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              autoCapitalize="characters"
              className="mb-4 rounded-2xl border border-border-light bg-white px-4 py-4 text-center text-2xl font-black tracking-widest dark:border-border-dark dark:bg-slate-900 dark:text-white"
            />
            <Button
              label="Approuver l'appareil"
              loading={codeMutation.isPending}
              disabled={shortCode.length < 4}
              onPress={() => void handleApproveCode()}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
