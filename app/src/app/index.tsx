import { useAuth } from '@/providers';
import { Loader } from '@/shared/ui/loader';
import { Redirect } from 'expo-router';

export default function Index(): JSX.Element {
  const { isLoading, isLoggedIn, user } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (isLoggedIn && user && !user.is_configured) {
    return <Redirect href={'/auth/onboarding' as any} />;
  }

  if (isLoggedIn && user?.is_configured) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
