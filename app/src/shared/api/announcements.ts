import { api } from './client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export const announcementsApi = {
  getAnnouncements: () => 
    api.get<Announcement[]>('/announcements'),

  createAnnouncement: (payload: { title: string; content: string }) => 
    api.post<Announcement>('/announcements', payload),
};
