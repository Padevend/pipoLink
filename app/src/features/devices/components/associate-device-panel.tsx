import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAwaitDeviceLink } from '@/features/devices/hooks/use-await-device-link';
import { usePrepareDeviceQr } from '@/features/devices/hooks/use-prepare-device-qr';
import type { DeviceQrPayloadV2 } from '@/features/devices/lib/verify-qr-payload';
import { useAuth } from '@/providers';
import type { User } from '@/shared/api/types';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';

interface AssociateDevicePanelProps {
  autoStart?: boolean;
  onLinked?: () => void;
}

export function AssociateDevicePanel({ autoStart = true, onLinked }: AssociateDevicePanelProps): JSX.Element {
  const prepare = usePrepareDeviceQr();
  const { signInWithTokens } = useAuth();
  const payload = prepare.data;
  const json = payload ? JSON.stringify(payload) : '';
  const poll = useAwaitDeviceLink(payload?.token ?? null, Boolean(payload));
  const linkedRef = useRef(false);

  useEffect(() => {
    if (autoStart && !prepare.data && !prepare.isPending && !prepare.isError) {
      prepare.mutate();
    }
  }, [autoStart, prepare.data, prepare.isPending, prepare.isError, prepare]);

  useEffect(() => {
    if (!poll.data || linkedRef.current) return;
    linkedRef.current = true;
    void (async () => {
      await signInWithTokens(
        {
          accessToken: poll.data!.accessToken,
          refreshToken: poll.data!.refreshToken,
          expiresAt: poll.data!.expiresAt,
          deviceId: poll.data!.deviceId,
        },
        poll.data!.user as User,
      );
      onLinked?.();
      if (poll.data!.user && !(poll.data!.user as User).is_configured) {
        router.replace('/auth/onboarding' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    })();
  }, [poll.data, signInWithTokens, onLinked]);

  const shareCode = async () => {
    if (!payload) return;
    await Share.share({
      message: `Code PipoLink : ${(payload as DeviceQrPayloadV2).shortCode}\n\nOu scannez le QR dans l'app sur votre appareil principal.`,
      title: 'Association appareil',
    });
  };

  return (
    <View className="flex-1 items-center gap-5 px-4 py-6">
      {prepare.isPending ? (
        <ActivityIndicator size="large" color={BRAND.primary} />
      ) : prepare.isError ? (
        <View className="items-center gap-3">
          <Text className="text-center text-error">Impossible de démarrer l&apos;association.</Text>
          <Button label="Réessayer" onPress={() => prepare.mutate()} />
        </View>
      ) : payload ? (
        <>
          <View className="rounded-3xl bg-white p-6 shadow-lg dark:bg-surface-dark">
            <QRCode value={json} size={220} />
          </View>

          <View className="w-full items-center rounded-2xl bg-surface-light px-6 py-4 dark:bg-surface-dark">
            <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Code de connexion
            </Text>
            <Text className="mt-2 text-3xl font-black tracking-[8px] text-primary">
              {(payload as DeviceQrPayloadV2).shortCode}
            </Text>
            <Text className="mt-2 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Saisissez ce code sur l&apos;appareil principal si le scan n&apos;est pas possible.
            </Text>
          </View>

          
        </>
      ) : null}

      <Text className="px-4 text-right text-sm text-text-secondary-light dark:text-text-secondary-dark">
        1. Connectez-vous sur votre appareil principal{'\n'}
        2. Paramètres → Appareils → Scanner ou saisir le code{'\n'}
        3. Approuvez l&apos;association
      </Text>

      <Button label="Partager le code" variant="outline" disabled={!payload} onPress={() => void shareCode()} />
      <Button label="Régénérer" variant="ghost" loading={prepare.isPending} onPress={() => prepare.mutate()} />
    </View>
  );
}
