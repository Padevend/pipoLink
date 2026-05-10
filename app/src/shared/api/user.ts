import { api } from './client';
import { User, UserProfile } from './types';

export const userApi = {
  /**
   * Get current user profile
   */
  getMe: () => 
    api.get<User>('/users/me'),

  /**
   * Update user profile
   */
  updateProfile: (profile: Partial<UserProfile>) => 
    api.put<void>('/users/me', profile),

  /**
   * Get user by ID (for messaging/mentions)
   */
  getUser: (id: string) => 
    api.get<User>(`/users/${id}`),

  /**
   * Search users
   */
  search: (query: string) => 
    api.get<User[]>('/users/search', { params: { q: query } }),
};
