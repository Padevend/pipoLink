import { api } from './client';

export interface UpdateMetadata {
  version: string;
  mandatory: boolean;
  notes?: string;
  changelog?: string[];
  downloadUrl?: string;
}

export const updatesApi = {
  checkUpdate: () => api.get<UpdateMetadata | null>('/updates'),
};
