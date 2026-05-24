import { router } from 'expo-router';
import { Activity, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKeyRecovery } from '@/features/auth/hooks/use-key-recovery';
import { Button } from '@/shared/ui/button';

export default function KeyRecoveryScreen(): JSX.Element {
  const { keyMissing } = useKeyRecovery();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

      {/* Header Style Glassmorphism Translucide */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-text-primary-light dark:text-text-primary-dark" />
        </Pressable>

        <View className="flex-1 ml-3">
          <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Récupération des clés
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Sécurité du protocole
          </Text>
        </View>
      </View>

      <View className="flex-1 justify-between p-5 pb-8">

        {/* Conteneur Central : Statut & Carte d'explication Satinée */}
        <View className="flex-1 justify-center max-w-md w-full mx-auto">

          {/* Icône d'état dynamique et épurée */}
          <View className="items-center mb-6">
            <View className={`h-14 w-14 items-center justify-center rounded-2xl border ${keyMissing === true
                ? 'bg-error/10 border-error/10'
                : keyMissing === false
                  ? 'bg-success/10 border-success/10'
                  : 'bg-primary/10 border-primary/10'
              }`}>
              {keyMissing === true ? (
                <ShieldAlert size={24} color="#EF4444" />
              ) : keyMissing === false ? (
                <ShieldCheck size={24} color="#22C55E" />
              ) : (
                <Activity size={24} color="#FF7A00" />
              )}
            </View>

            <Text className="mt-3 text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {keyMissing === true
                ? 'Clés introuvables'
                : keyMissing === false
                  ? 'Clés sécurisées'
                  : 'Analyse du coffre-fort'}
            </Text>
          </View>

          {/* Fiche explicative en verre poli */}
          <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md ">
            <Text className="text-[13px] leading-[22px] tracking-wide text-text-primary-light/80 dark:text-text-primary-dark/80 text-center">
              {keyMissing === true
                ? 'Vos clés cryptographiques sont introuvables sur cet appareil. Pour des raisons de sécurité, elles ne peuvent pas être récupérées à distance. Affichez un QR sur cet appareil, puis scannez-le depuis un autre appareil déjà configuré pour redistribuer les clés de vos conversations.'
                : keyMissing === false
                  ? 'Les clés locales semblent présentes et fonctionnelles. Si un message reste cependant illisible, veuillez vérifier votre connectivité réseau ou contacter notre support technique.'
                  : 'Vérification de l’intégrité des clés de chiffrement local…'}
            </Text>
          </View>
        </View>

        {/* Section Actions & Boutons inférieurs */}
        <View className="gap-3 max-w-md w-full mx-auto mt-4">
          {keyMissing === true ? (
            <>
              <Button
                label="Afficher un QR (cet appareil)"
                onPress={() => router.push('/devices/add' as any)}
                className="rounded-2xl h-12  active:scale-[0.98] transition-transform"
              />
              <Button
                label="Scanner un QR (appareil principal)"
                variant="outline"
                onPress={() => router.push('/devices/scan' as any)}
                className="rounded-2xl h-12 border-border-light/60 dark:border-border-dark/30 active:scale-[0.98] transition-transform bg-surface-light/30 dark:bg-surface-dark/20"
              />
            </>
          ) : keyMissing === false ? (
            <Button
              label="Retour à l’accueil"
              onPress={() => router.replace('/(tabs)' as any)}
              className="rounded-2xl h-12 active:scale-[0.98] transition-transform"
            />
          ) : null}
        </View>

      </View>
    </SafeAreaView>
  );
}