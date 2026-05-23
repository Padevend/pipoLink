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
    <View className="w-full items-center gap-6 px-2 py-4">
      {prepare.isPending ? (
        <View className="h-64 items-center justify-center gap-3">
          <ActivityIndicator size="small" color={BRAND.primary} />
          <Text className="text-[12px] font-medium text-slate-400">
            Génération des clés sécurisées...
          </Text>
        </View>
      ) : prepare.isError ? (
        <View className="w-full items-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-6">
          <AlertCircle size={24} color="#EF4444" />
          <Text className="text-center text-[13px] font-medium leading-[20px] text-red-600 px-2">
            {prepare.error?.message || "Une erreur est survenue lors de la synchronisation."}
          </Text>
          <Button 
            label="Réessayer la génération" 
            onPress={() => prepare.mutate()} 
            className="h-10 rounded-xl bg-red-600 w-full"
          />
        </View>
      ) : payload ? (
        <>
          {/* Encapsulation du QR Code (Zéro Ombre - Style Verre Lumineux Pur) */}
          <View className="rounded-[28px] border border-slate-200/60 bg-white p-6 backdrop-blur-md">
            <QRCode 
              value={json} 
              size={200} 
              backgroundColor="#FFFFFF"
              color="#0F172A"
            />
          </View>

          {/* Panneau d'affichage du ShortCode alphanumérique */}
          <View className="w-full items-center rounded-2xl border border-slate-200/50 bg-white px-5 py-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Code de connexion alternatif
            </Text>
            <Text className="mt-1.5 text-3xl font-black tracking-[6px] text-primary" style={{ color: BRAND.primary }}>
              {(payload as DeviceQrPayloadV2).shortCode}
            </Text>
            <Text className="mt-2 text-center text-[11px] leading-[16px] font-medium text-slate-400 px-2">
              Saisissez manuellement ce code à l'écran si le scan de l'appareil photo échoue.
            </Text>
          </View>
        </>
      ) : null}

      {/* Guide des étapes utilisateur sous forme de liste épurée */}
      <View className="w-full rounded-2xl border border-slate-200/40 bg-slate-50/60 p-4 gap-y-3">
        <View className="flex-row items-center gap-3">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-slate-200">
            <Text className="text-[11px] font-bold text-slate-700">1</Text>
          </View>
          <Text className="text-[12px] font-medium text-slate-600 flex-1">
            Ouvrez l'application sur votre <Text className="font-bold text-slate-800">appareil principal</Text>.
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-slate-200">
            <Text className="text-[11px] font-bold text-slate-700">2</Text>
          </View>
          <Text className="text-[12px] font-medium text-slate-600 flex-1">
            Allez dans <Text className="font-semibold text-slate-700">Paramètres</Text> → <Text className="font-semibold text-slate-700">Appareils</Text> → <Text className="font-semibold text-slate-700">Associer</Text>.
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-slate-200">
            <Text className="text-[11px] font-bold text-slate-700">3</Text>
          </View>
          <Text className="text-[12px] font-medium text-slate-600 flex-1">
            Scannez le QR Code ci-dessus ou renseignez le code textuel.
          </Text>
        </View>
      </View>

      {/* Actions de bas de page */}
      <View className="w-full gap-2.5 mt-2">
        <Button 
          label="Partager les accès" 
          variant="outline" 
          disabled={!payload} 
          leftIcon={<Share2 size={16} className="text-slate-700" />}
          onPress={() => void shareCode()} 
          className="rounded-xl h-11 border-slate-200 bg-white text-slate-800"
        />
        
        <Button 
          label="Régénérer un nouveau code" 
          variant="ghost" 
          disabled={prepare.isPending}
          leftIcon={<RefreshCw size={14} className="text-slate-400" />}
          onPress={() => prepare.mutate()} 
          className="h-10 text-slate-500"
        />
      </View>

    </View>
  );
}