import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

export async function attachAuthHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await SecureStorageService.get(SECURE_STORAGE_KEYS.AUTH_TOKEN);
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
    SecureStorageService.set(SECURE_STORAGE_KEYS.AUTH_TOKEN, accessToken),
    SecureStorageService.set(SECURE_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([SecureStorageService.remove(SECURE_STORAGE_KEYS.AUTH_TOKEN), SecureStorageService.remove(SECURE_STORAGE_KEYS.REFRESH_TOKEN)]);
}
