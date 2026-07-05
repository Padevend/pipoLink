import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Share2, RefreshCw, AlertCircle } from 'lucide-react-native';

import { useAwaitDeviceLink } from '@/features/devices/hooks/use-await-device-link';
import { usePrepareDeviceQr } from '@/features/devices/hooks/use-prepare-device-qr';
import type { DeviceQrPayloadV2 } from '@/features/devices/lib/verify-qr-payload';
import { useAuth } from '@/providers';
import type { User } from '@/shared/api/types';
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
    <View className="w-full items-center gap-y-5 py-2">
      {prepare.isPending ? (
        <View className="h-60 items-center justify-center gap-y-2">
          <ActivityIndicator size="small" color="#F97316" />
          <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Génération des clés sécurisées…
          </Text>
        </View>
      ) : prepare.isError ? (
        <View className="w-full items-center gap-y-4 rounded-xl border border-red-200 bg-white p-5 dark:border-red-900/50 dark:bg-zinc-950">
          <AlertCircle size={20} color="#EF4444" />
          <Text className="text-center text-xs font-semibold leading-5 text-red-600 dark:text-red-400 px-2">
            {prepare.error?.message || "Une erreur est survenue lors de la synchronisation."}
          </Text>
          <Button 
            label="Réessayer la génération" 
            onPress={() => prepare.mutate()} 
            className="h-11 rounded-xl bg-red-500 w-full"
          />
        </View>
      ) : payload ? (
        <>
          {/* Conteneur QR Code Opaque Mat */}
          <View className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-900">
            <QRCode 
              value={json} 
              size={180} 
              backgroundColor="#FFFFFF"
              color="#09090B"
            />
          </View>

          {/* Panneau du code court alphanumérique */}
          <View className="w-full items-center rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-950">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Code de connexion alternatif
            </Text>
            <Text className="mt-1 text-2xl font-black tracking-[4px] text-orange-500 dark:text-orange-400">
              {(payload as DeviceQrPayloadV2).shortCode}
            </Text>
            <Text className="mt-2 text-center text-[11px] leading-4 font-semibold text-zinc-400 dark:text-zinc-500 px-2">
              Saisissez manuellement ce code à l'écran si le scan de l'appareil photo échoue.
            </Text>
          </View>
        </>
      ) : null}

      {/* Guide des étapes utilisateur géométrique */}
      <View className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 gap-y-3 dark:border-zinc-900 dark:bg-zinc-900/40">
        <View className="flex-row items-start gap-x-3">
          <View className="h-5 w-5 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 mt-0.5">
            <Text className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">1</Text>
          </View>
          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Ouvrez l'application sur votre <Text className="font-bold text-zinc-900 dark:text-zinc-50">appareil principal</Text>.
          </Text>
        </View>

        <View className="flex-row items-start gap-x-3">
          <View className="h-5 w-5 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 mt-0.5">
            <Text className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">2</Text>
          </View>
          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Allez dans <Text className="font-bold text-zinc-700 dark:text-zinc-300">Paramètres</Text> → <Text className="font-bold text-zinc-700 dark:text-zinc-300">Appareils</Text> → <Text className="font-bold text-zinc-700 dark:text-zinc-300">Associer</Text>.
          </Text>
        </View>

        <View className="flex-row items-start gap-x-3">
          <View className="h-5 w-5 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 mt-0.5">
            <Text className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">3</Text>
          </View>
          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Scannez le QR Code ci-dessus ou renseignez le code textuel.
          </Text>
        </View>
      </View>

      {/* Actions de bas de page */}
      <View className="w-full gap-y-2 mt-1">
        <Button 
          label="Partager les accès" 
          variant="outline" 
          disabled={!payload} 
          leftIcon={<Share2 size={14} color="#3F3F46" />}
          onPress={() => void shareCode()} 
          className="rounded-xl h-11 border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950"
        />
        
        <Button 
          label="Régénérer un nouveau code" 
          variant="ghost" 
          disabled={prepare.isPending}
          leftIcon={<RefreshCw size={12} color="#71717A" />}
          onPress={() => prepare.mutate()} 
          className="h-10 text-zinc-500 dark:text-zinc-400"
        />
      </View>

    </View>
  );
}