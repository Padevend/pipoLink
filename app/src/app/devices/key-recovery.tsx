import { router } from 'expo-router';
import { Activity, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKeyRecovery } from '@/features/auth/hooks/use-key-recovery';
import { Button } from '@/shared/ui/button';

export default function KeyRecoveryScreen(): JSX.Element {
  const { keyMissing } = useKeyRecovery();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-150 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        <View className="flex-1 ml-3">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Récupération des clés
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            Sécurité du protocole
          </Text>
        </View>
      </View>

      <View className="flex-1 justify-between p-4 pb-6">

        {/* CONTENU CENTRAL MAT */}
        <View className="flex-1 justify-center max-w-md w-full mx-auto">

          {/* Badge d'état géométrique et épuré */}
          <View className="items-center mb-6">
            <View className={`h-12 w-12 items-center justify-center rounded-xl border ${keyMissing === true
                ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
                : keyMissing === false
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
                  : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900'
              }`}>
              {keyMissing === true ? (
                <ShieldAlert size={18} color="#EF4444" />
              ) : keyMissing === false ? (
                <ShieldCheck size={18} color="#22C55E" />
              ) : (
                <Activity size={18} color="#F97316" />
              )}
            </View>

            <Text className="mt-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {keyMissing === true
                ? 'Clés introuvables'
                : keyMissing === false
                  ? 'Clés sécurisées'
                  : 'Analyse du coffre-fort'}
            </Text>
          </View>

          {/* Fiche explicative en bloc mat solide */}
          <View className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <Text className="text-xs font-semibold leading-5 text-zinc-500 dark:text-zinc-400 text-center">
              {keyMissing === true
                ? 'Vos clés cryptographiques sont introuvables sur cet appareil. Pour des raisons de sécurité, elles ne peuvent pas être récupérées à distance. Affichez un QR sur cet appareil, puis scannez-le depuis un autre appareil déjà configuré pour redistribuer les clés de vos conversations.'
                : keyMissing === false
                  ? 'Les clés locales semblent présentes et fonctionnelles. Si un message reste cependant illisible, veuillez vérifier votre connectivité réseau ou contacter notre support technique.'
                  : 'Vérification de l’intégrité des clés de chiffrement local…'}
            </Text>
          </View>
        </View>

        {/* SECTION ACTIONS : Boutons géométriques mats */}
        <View className="gap-y-2.5 max-w-md w-full mx-auto mt-4">
          {keyMissing === true ? (
            <>
              <Button
                label="Afficher un QR (cet appareil)"
                onPress={() => router.push('/devices/add' as any)}
                className="bg-orange-500 rounded-xl h-11"
              />
              <Button
                label="Scanner un QR (appareil principal)"
                variant="outline"
                onPress={() => router.push('/devices/scan' as any)}
                className="rounded-xl h-11 border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
              />
            </>
          ) : keyMissing === false ? (
            <Button
              label="Retour à l’accueil"
              onPress={() => router.replace('/(tabs)' as any)}
              className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-xl h-11"
            />
          ) : null}
        </View>

      </View>
    </SafeAreaView>
  );
}