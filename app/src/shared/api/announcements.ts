import { PickedFile } from '@/features/messaging/hooks/use-send-message';
import { api } from './client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  poster: string | null;
  previewUrl: string | null;
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
    poster: raw.poster ?? null,
    previewUrl: raw.previewUrl ?? null,
    createdAt:
      raw.createdAt ??
      (typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString()),
    updatedAt: raw.updatedAt ?? raw.updated_at,
    author: raw.author,
  };
}

function toUploadFile(file: PickedFile): {
  uri: string;
  name: string;
  type: string;
} {
  return {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/octet-stream",
  };
}

export const announcementsApi = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    const raw = await api.get<RawAnnouncement[]>('/announcements');
    return (raw ?? []).map(normalize);
  },

  createAnnouncement: async (payload: { title: string; content: string, poster: PickedFile | null }): Promise<Announcement> => {
    const formData = new FormData();
    // @ts-expect-error React Native FormData file blob
    if (payload.poster) formData.append("file", toUploadFile(payload.poster));
    formData.append(
      "payload",
      JSON.stringify({
        title: payload.title,
        content: payload.content
      }),
    );
    const raw = await api.upload<RawAnnouncement>('/announcements', formData);
    return normalize(raw);
  },
};
