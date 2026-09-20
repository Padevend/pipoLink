import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Share, Text, View, Pressable } from 'react-native';
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
      message: `Code d'accès : ${(payload as DeviceQrPayloadV2).shortCode}\n\nOu scannez le QR dans l'app sur votre appareil principal.`,
      title: 'Association appareil',
    });
  };

  return (
    <View className="w-full items-center gap-y-6">
      {prepare.isPending ? (
        <View className="h-64 w-full items-center justify-center gap-y-4 bg-zinc-100 dark:bg-[#1A1A1A] rounded-[40px]">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Génération des clés...
          </Text>
        </View>
      ) : prepare.isError ? (
        <View className="w-full items-center gap-y-5 rounded-[40px] bg-red-50 dark:bg-red-950 p-8">
          <View className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 items-center justify-center">
            <AlertCircle size={32} color="#EF4444" strokeWidth={2.5} />
          </View>
          <Text className="text-center text-sm font-black leading-6 text-red-600 dark:text-red-400">
            {prepare.error?.message || "Échec de la synchronisation."}
          </Text>
          <Button 
            label="Réessayer" 
            onPress={() => prepare.mutate()} 
            variant="danger"
            className="w-full mt-2"
          />
        </View>
      ) : payload ? (
        <>
          <View className="items-center justify-center p-8 rounded-[48px] bg-white border-8 border-zinc-100 dark:border-[#1A1A1A]">
            <QRCode 
              value={json} 
              size={180} 
              backgroundColor="#FFFFFF"
              color="#09090B"
            />
          </View>

          <View className="w-full items-center rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] px-6 py-6">
            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Code de connexion alternatif
            </Text>
            <Text className="mt-2 text-4xl font-black tracking-[8px] text-orange-500">
              {(payload as DeviceQrPayloadV2).shortCode}
            </Text>
          </View>
        </>
      ) : null}

      <View className="w-full rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] p-6 gap-y-5">
        <View className="flex-row items-center gap-x-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-950 dark:bg-white">
            <Text className="text-sm font-black text-white dark:text-zinc-950">1</Text>
          </View>
          <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Ouvrez l'application sur votre <Text className="font-black text-zinc-950 dark:text-white">appareil principal</Text>.
          </Text>
        </View>

        <View className="flex-row items-center gap-x-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-950 dark:bg-white">
            <Text className="text-sm font-black text-white dark:text-zinc-950">2</Text>
          </View>
          <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Allez dans <Text className="font-black text-zinc-950 dark:text-white">Paramètres</Text> → <Text className="font-black text-zinc-950 dark:text-white">Appareils</Text> → <Text className="font-black text-zinc-950 dark:text-white">Associer</Text>.
          </Text>
        </View>

        <View className="flex-row items-center gap-x-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500">
            <Text className="text-sm font-black text-white">3</Text>
          </View>
          <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex-1 leading-5">
            Scannez le QR Code ou saisissez le code textuel ci-dessus.
          </Text>
        </View>
      </View>

      <View className="w-full gap-y-2 mt-2">
        <Button 
          label="Partager les accès" 
          variant="secondary" 
          disabled={!payload} 
          leftIcon={<Share2 size={20} color="#F97316" strokeWidth={2.5} />}
          onPress={() => void shareCode()} 
          className="w-full"
        />
        
        <Pressable 
          disabled={prepare.isPending}
          onPress={() => prepare.mutate()} 
          className="h-16 w-full flex-row items-center justify-center gap-3 active:opacity-50"
        >
          <RefreshCw size={16} color="#A1A1AA" strokeWidth={2.5} />
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Régénérer un code
          </Text>
        </Pressable>
      </View>
    </View>
  );
}