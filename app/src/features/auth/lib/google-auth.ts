import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function signInWithGoogle(): Promise<{ idToken: string; nonce: string }> {
  const clientId = Platform.OS === "android" ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID : Platform.OS === "ios" ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) throw new Error('Google Sign-In n’est pas configuré dans cette build.');

  const redirectUri = Linking.createURL('oauth/google');
  const nonce = base64Url(await Crypto.getRandomBytesAsync(24));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid profile email',
    nonce,
    prompt: 'select_account',
  });

  const result = await WebBrowser.openAuthSessionAsync(
    `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`,
    redirectUri,
  );
  if (result.type !== 'success' || !result.url) throw new Error('Connexion Google annulée.');

  const hash = result.url.split('#')[1] || '';
  const fragment = new URLSearchParams(hash);
  const idToken = fragment.get('id_token');
  if (!idToken) throw new Error('Google n’a pas retourné de jeton d’identité.');
  return { idToken, nonce };
}
