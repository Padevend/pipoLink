import { useState } from 'react';
import { Share, Text, TextInput, View } from 'react-native';

import { usePrepareDeviceQr } from '@/features/devices/hooks/use-prepare-device-qr';
import type { DeviceQrPayloadV1 } from '@/features/devices/lib/verify-qr-payload';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function DeviceAddScreen(): JSX.Element {
  const prepare = usePrepareDeviceQr();
  const [payload, setPayload] = useState<DeviceQrPayloadV1 | null>(null);
  const [json, setJson] = useState('');

  const generate = () => {
    prepare.mutate(undefined, {
      onSuccess: (p) => {
        setPayload(p);
        setJson(JSON.stringify(p));
      },
    });
  };

  const share = async () => {
    if (!json) return;
    await Share.share({ message: json, title: 'PipoLink — liaison appareil' });
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Ajouter cet appareil" subtitle="Partagez ce code avec votre appareil principal" />
      <View className="flex-1 gap-3 p-4">
        <Button label="Générer le code de liaison" loading={prepare.isPending} onPress={() => void generate()} />
        {prepare.isError ? (
          <Text className="text-red-600">Impossible de générer le jeton. Vérifiez que vous êtes connecté.</Text>
        ) : null}
        <Text className="text-xs text-slate-500">
          Envoyez ce JSON à votre appareil principal (écran Scanner) ou utilisez Partager.
        </Text>
        <TextInput
          multiline
          value={json}
          editable={false}
          className="min-h-[160px] rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <Button label="Partager le code" onPress={() => void share()} disabled={!json} />
        {payload ? (
          <Text className="text-[10px] text-slate-400">Token court : {payload.token.slice(0, 8)}…</Text>
        ) : null}
      </View>
    </View>
  );
}
