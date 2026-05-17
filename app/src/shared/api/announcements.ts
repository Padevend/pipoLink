import { api } from './client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: { username: string | null };
}

type RawAnnouncement = Partial<Announcement> & {
  created_at?: string;
  updated_at?: string;
  author?: { username: string | null };
};

function normalize(raw: RawAnnouncement): Announcement {
  return {
    id: raw.id ?? '',
    title: raw.title ?? '',
    content: raw.content ?? '',
    createdAt:
      raw.createdAt ??
      (typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString()),
    updatedAt: raw.updatedAt ?? raw.updated_at,
    author: raw.author,
  };
}

export const announcementsApi = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    const raw = await api.get<RawAnnouncement[]>('/announcements');
    return (raw ?? []).map(normalize);
  },

  createAnnouncement: async (payload: { title: string; content: string }): Promise<Announcement> => {
    const raw = await api.post<RawAnnouncement>('/announcements', payload);
    return normalize(raw);
  },
};
