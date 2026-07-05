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
};
