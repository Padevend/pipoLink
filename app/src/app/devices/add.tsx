import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAwaitDeviceLink } from '@/features/devices/hooks/use-await-device-link';
import { usePrepareDeviceQr } from '@/features/devices/hooks/use-prepare-device-qr';
import type { DeviceQrPayloadV1 } from '@/features/devices/lib/verify-qr-payload';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import type { User } from '@/shared/api/types';

export default function DeviceAddScreen(): JSX.Element {
  const prepare = usePrepareDeviceQr();
  const { signInWithTokens } = useAuth();
  const [payload, setPayload] = useState<DeviceQrPayloadV1 | null>(null);
  const [json, setJson] = useState('');
  const [awaiting, setAwaiting] = useState(false);

  const poll = useAwaitDeviceLink(payload?.token ?? null, awaiting);
  const linkedRef = useRef(false);

  const generate = () => {
    prepare.mutate(undefined, {
      onSuccess: (p) => {
        setPayload(p);
        setJson(JSON.stringify(p));
        setAwaiting(true);
      },
    });
  };

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
      setAwaiting(false);
      router.replace('/(tabs)' as any);
    })();
  }, [poll.data, signInWithTokens]);

  const share = async () => {
    if (!json) return;
    await Share.share({ message: json, title: 'PipoLink — liaison appareil' });
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Ajouter cet appareil" subtitle="Scannez ce QR depuis votre appareil principal" />
      <View className="flex-1 items-center gap-4 p-4">
        <Button label="Générer le code de liaison" loading={prepare.isPending} onPress={() => void generate()} />
        {prepare.isError ? (
          <Text className="text-center text-red-600">Impossible de générer le jeton. Vérifiez que vous êtes connecté.</Text>
        ) : null}
        {json ? (
          <View className="items-center rounded-3xl bg-white p-6 dark:bg-slate-900">
            <QRCode value={json} size={220} />
            {awaiting ? (
              <View className="mt-4 flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-slate-500">En attente de validation sur l&apos;appareil principal…</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text className="text-center text-xs text-slate-500">
          Ou partagez le code JSON si le scan caméra n&apos;est pas disponible sur l&apos;appareil principal.
        </Text>
        <Button label="Partager le code JSON" onPress={() => void share()} disabled={!json} variant="outline" />
        {payload ? (
          <Text className="text-[10px] text-slate-400">Jeton : {payload.token.slice(0, 8)}…</Text>
        ) : null}
      </View>
    </View>
  );
}
