import { api } from './client';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  email: string;
}

export const accountApi = {
  changePassword: (payload: ChangePasswordPayload) =>
    api.post<null>('/auth/change-password', payload),

  deleteAccount: (payload: DeleteAccountPayload) =>
    api.delete<null>('/users/me', {
      body: JSON.stringify(payload),
    }),
} as const;
