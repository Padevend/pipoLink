export interface DeviceModel {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'desktop';
  isPrimary: boolean;
  lastActiveAt: string;
  linkedAt: string;
}
