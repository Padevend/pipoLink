import { useAuth } from '@/providers';
import { Loader } from '@/shared/ui/loader';
import { Redirect } from 'expo-router';

export default function Index(): JSX.Element {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  return <Redirect href={isLoggedIn ? "/(tabs)" : "/auth/login"} />;
}
