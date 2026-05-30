import { useAuth } from '@/providers/auth-provider';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Hook — logout with confirmation modal.
 *
 * Returns a function that, when called, shows an Alert
 * confirmation dialog, then clears cache and redirects.
 */
export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const confirmLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Vous allez être déconnecté de votre compte. Vos données locales seront effacées de cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            queryClient.clear();
            await logout();
            router.dismissAll()
            router.replace('/auth/login', { });
          },
        },
      ],
    );
  }, [logout, queryClient]);

  return { confirmLogout };
}
