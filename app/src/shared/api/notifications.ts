import { api } from './client';

export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: () => 
    api.get<Notification[]>('/notifications'),

  markAllAsRead: () => 
    api.post<void>('/notifications/mark-all-read'),

  markAsRead: (id: string) => 
    api.post<void>(`/notifications/${id}/read`),
};
