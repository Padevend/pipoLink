import { api } from './client';
import { normalizeUser, type UserWithProfile } from './normalize-user';
import { User, UserProfile } from './types';

export interface SearchUserResult {
  id: string;
  username: string | null;
  matricule: string | null;
  email: string | null;
  profile: {
    firstname: string;
    lastname: string;
    avatarUrl: string | null;
    niveau: string | null;
    filiere: string | null;
  } | null;
}

export const userApi = {
  searchUsers: (q: string) => api.get<SearchUserResult[]>('/users/search', { params: { q } }),
  getMe: () => api.get<UserWithProfile>('/users/me').then(normalizeUser),

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
    bio?: string;
    deviceName: string;
    devicePlatform: string;
    deviceFingerprint: string;
    devicePublicKey: string;
    deviceKeySignature: string;
  }) =>
    api.post<{
      user: User;
      device: { id: string };
      tokens: { accessToken: string; refreshToken: string; expiresAt: number };
    }>('/users/me/onboarding', body),

  uploadAvatar: (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    return api.upload<{ avatarUrl: string }>('/users/me/avatar', formData);
  },

  listDevicePublicKeys: (userId: string) =>
    api.get<{ deviceId: string; publicKey: string }[]>(`/users/${userId}/devices/public-keys`),

  getUser: (id: string) => api.get<User>(`/users/get/${id}`),

  search: (query: string) => api.get<User[]>('/users/search', { params: { q: query } }),
};
