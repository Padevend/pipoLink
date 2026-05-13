import { useAuth } from '@/providers';
import { Loader } from '@/shared/ui/loader';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout(): JSX.Element {
  const { isLoading, isLoggedIn, user } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (isLoggedIn && user?.is_configured) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
