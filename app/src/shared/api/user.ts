import { api } from './client';
import { User, UserProfile } from './types';

export const userApi = {
  /**
   * Get current user profile
   */
  getMe: () => api.get<User>('/users/me'),

  updateProfile: (profile: Partial<UserProfile>) => api.put<void>('/users/me', profile),

  completeOnboarding: (body: {
    firstname: string;
    lastname: string;
    username?: string;
    phone?: string;
    gender?: string;
    matricule?: string;
    niveau?: string;
    filiere?: string;
    deviceName: string;
    devicePlatform: string;
    deviceFingerprint: string;
    devicePublicKey: string;
    deviceKeySignature: string;
  }) => api.post<{ user: User; device: { id: string } }>('/users/me/onboarding', body),

  listDevicePublicKeys: (userId: string) =>
    api.get<{ deviceId: string; publicKey: string }[]>(`/users/${userId}/devices/public-keys`),

  getUser: (id: string) => api.get<User>(`/users/${id}`),

  search: (query: string) => api.get<User[]>('/users/search', { params: { q: query } }),
};
