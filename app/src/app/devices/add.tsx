import { Redirect } from 'expo-router';

/** Redirige vers le flux d'association sans authentification. */
export default function DeviceAddScreen(): JSX.Element {
  return <Redirect href="/auth/link-device" />;
}
