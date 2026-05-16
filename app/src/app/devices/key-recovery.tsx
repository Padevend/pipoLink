import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { useKeyRecovery } from '@/features/auth/hooks/use-key-recovery';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function KeyRecoveryScreen(): JSX.Element {
  const { keyMissing } = useKeyRecovery();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Récupération des clés" subtitle="Perte de clé sur cet appareil" />
      <View className="gap-4 p-4">
        <Text className="text-base leading-6 text-slate-700 dark:text-slate-300">
          {keyMissing === true
            ? 'Vos clés cryptographiques sont introuvables sur cet appareil. Pour des raisons de sécurité, elles ne peuvent pas être récupérées à distance. Affichez un QR sur cet appareil, puis scannez-le depuis un autre appareil déjà configuré pour redistribuer les clés de vos conversations.'
            : keyMissing === false
              ? 'Les clés locales semblent présentes. Si un message reste illisible, vérifiez votre connexion ou contactez le support.'
              : 'Analyse en cours…'}
        </Text>
        {keyMissing === true ? (
          <>
            <Button label="Afficher un QR (cet appareil)" onPress={() => router.push('/devices/add' as any)} />
            <Button
              label="Scanner un QR (appareil principal)"
              variant="outline"
              onPress={() => router.push('/devices/scan' as any)}
            />
          </>
        ) : keyMissing === false ? (
          <Button label="Retour à l’accueil" onPress={() => router.replace('/(tabs)' as any)} />
        ) : null}
      </View>
    </View>
  );
}
