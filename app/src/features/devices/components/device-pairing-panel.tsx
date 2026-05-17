import { ActivityIndicator, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { DeviceQrPayloadV2 } from '@/features/devices/lib/verify-qr-payload';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';

interface DevicePairingPanelProps {
  payload: DeviceQrPayloadV2 | null;
  json: string;
  isLoading?: boolean;
  isError?: boolean;
  awaiting?: boolean;
  onRegenerate?: () => void;
}

export function DevicePairingPanel({
  payload,
  json,
  isLoading,
  isError,
  awaiting,
  onRegenerate,
}: DevicePairingPanelProps): JSX.Element {
  const share = async () => {
    if (!json) return;
    await Share.share({ message: json, title: 'PipoLink — code de liaison' });
  };

  if (isLoading && !payload) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Génération du code…
        </Text>
      </View>
    );
  }

  if (isError && !payload) {
    return (
      <Text className="text-center text-error">
        Impossible de créer la demande d&apos;appairage. Vérifiez votre connexion.
      </Text>
    );
  }

  if (!payload) return <></>;

  return (
    <View className="w-full items-center gap-5">
      <View className="w-full items-center rounded-3xl bg-white p-6 dark:bg-surface-dark">
        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light">
          Code de connexion
        </Text>
        <Text className="text-4xl font-black tracking-[0.35em] text-primary">{payload.shortCode}</Text>
        <Text className="mt-2 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Saisissez ce code sur l&apos;appareil principal si le scan n&apos;est pas possible.
        </Text>
      </View>

      <View className="items-center rounded-3xl bg-white p-6 dark:bg-surface-dark">
        <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary-light">
          QR à scanner
        </Text>
        <QRCode value={json} size={220} />
        {awaiting ? (
          <View className="mt-4 flex-row items-center gap-2">
            <ActivityIndicator size="small" color={BRAND.primary} />
            <Text className="text-sm text-text-secondary-light">En attente d&apos;approbation…</Text>
          </View>
        ) : null}
      </View>

      <Text className="px-4 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
        Sur votre appareil principal : connectez-vous, puis Paramètres → Appareils → Scanner le QR ou saisir le code.
      </Text>

      <View className="w-full gap-2">
        {onRegenerate ? (
          <Button label="Régénérer" variant="outline" onPress={onRegenerate} loading={isLoading} />
        ) : null}
        <Button label="Partager le code" variant="ghost" onPress={() => void share()} disabled={!json} />
      </View>
    </View>
  );
}
