import { useAuth } from '@/providers';
import { Loader } from '@/shared/ui/loader';
import { Redirect, Stack, useSegments } from 'expo-router';

export default function AuthLayout(): JSX.Element {
  const { isLoading, isLoggedIn, user } = useAuth();
  const segments = useSegments();
  const onLinkDevice = segments[segments.length - 1] === 'link-device';

  if (isLoading) {
    return <Loader />;
  }

  if (isLoggedIn && user?.is_configured && !onLinkDevice) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
