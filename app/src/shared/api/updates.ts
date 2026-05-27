import { api } from './client';

export interface UpdateLink {
  platform: 'android' | 'ios';
  link: string;
}

export interface UpdateMetadata {
  version: string;
  changelog: string[];
  isRequired: boolean;
  minSdkVersion?: string;
  severity: 'low' | 'medium' | 'critical';
  type: 'manual' | 'auto';
  links: UpdateLink[];
}

export const updatesApi = {
  checkUpdate: () => api.get<UpdateMetadata | null>('/updates'),
};
