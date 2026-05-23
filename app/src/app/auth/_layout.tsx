import { useAuth } from '@/providers';
import { Loader } from '@/shared/ui/loader';
import { Redirect, Stack, useSegments } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout(): JSX.Element {
  const { isLoading, isLoggedIn, user } = useAuth();
  const segments = useSegments();
  const onLinkDevice = segments[segments.length - 1] === 'link-device';

  if (!isLoading && isLoggedIn && user?.is_configured && !onLinkDevice) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
      {isLoading ? (
        <View
          className="absolute inset-0 z-10 items-center justify-center bg-background-light/95 dark:bg-background-dark/95"
          pointerEvents="auto"
        >
          <Loader />
        </View>
      ) : null}
    </View>
  );
}
