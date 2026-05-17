import { Redirect } from 'expo-router';

/** Paramètres : même flux que l'association depuis la connexion. */
export default function DeviceQrSettingsScreen(): JSX.Element {
  return <Redirect href="/auth/link-device" />;
}
