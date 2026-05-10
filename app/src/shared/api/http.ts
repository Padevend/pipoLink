import { getSecureItem, removeSecureItem, setSecureItem } from '@/shared/storage/secure-storage';

export async function attachAuthHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getSecureItem('access_token');
  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export async function persistTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    setSecureItem('access_token', accessToken),
    setSecureItem('refresh_token', refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([removeSecureItem('access_token'), removeSecureItem('refresh_token')]);
}
