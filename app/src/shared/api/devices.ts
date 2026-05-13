import { api } from './client';

export interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'desktop';
  lastActiveAt: string;
  linkedAt: string;
  isPrimary: boolean;
}

export const devicesApi = {
  getDevices: () => api.get<Device[]>('/devices'),
  
  removeDevice: (id: string) => api.delete<void>(`/devices/${id}`),
  
  verifyQr: (payload: {
    token: string;
    deviceName: string;
    platform: string;
    fingerprint: string;
    newDevice?: { publicKey: string; keySignature: string };
    chatKeyBundle?: { chatId: string; encryptedKey: string }[];
  }) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      user: unknown;
      deviceId?: string;
      device: Device;
    }>('/auth/qr/verify', payload),
};
