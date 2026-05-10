import { View } from 'react-native';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';

export default function AccountScreen(): JSX.Element {
  const mutation = useLogout();

  return (
    <View className="flex-1 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <Header title="Compte" subtitle="Sécurité & appareils" />
      <View className="gap-4">
        <Button label="Changer le mot de passe" variant="secondary" onPress={() => undefined} />
        <Button label="Déconnexion" variant="danger" loading={mutation.isPending} onPress={() => void mutation.mutateAsync()} />
      </View>
    </View>
  );
}
