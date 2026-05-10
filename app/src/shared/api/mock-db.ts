import { generateUUID } from '@/shared/utils/uuid';

export type UserRole = 'admin' | 'moderator' | 'member';

export interface User {
  id: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'announcement';
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  participants: User[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'document';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: string;
}

export interface Folder {
  id: string;
  parentId: string | null;
  name: string;
  documentCount: number;
  color?: string;
}

export interface DocumentItem {
  id: string;
  folderId: string;
  title: string;
  type: 'CC' | 'TD' | 'TP' | 'Examen' | 'Cours' | 'Résumé';
  niveau: string;
  ue: string;
  annee: number;
  description?: string;
  fileUrl: string;
  size: number;
  downloadCount: number;
  uploadedBy: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'desktop';
  isPrimary: boolean;
  lastActiveAt: string;
  linkedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  kind: 'success' | 'error' | 'warning' | 'info';
  createdAt: string;
  read: boolean;
}

export interface AISession {
  id: string;
  title: string;
  updatedAt: string;
}

export interface UpdateMetadata {
  version: string;
  buildNumber: number;
  changelog: string[];
  size: string;
  downloadUrl: string;
}

const primaryUser: User = {
  id: 'user-primary',
  username: 'pavel.zira',
  phone: '+237650000000',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  role: 'admin',
  createdAt: '2026-05-01T08:00:00.000Z',
};

const colleague: User = {
  id: 'user-amelie',
  username: 'amélie.k',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  role: 'member',
  createdAt: '2026-05-02T08:00:00.000Z',
};

const groupUser: User = {
  id: 'user-omar',
  username: 'omar.g',
  avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
  role: 'moderator',
  createdAt: '2026-05-03T08:00:00.000Z',
};

export const mockDb = {
  session: {
    user: primaryUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    deviceId: generateUUID(),
  },
  conversations: [
    {
      id: 'conv-announcement',
      type: 'announcement',
      name: 'Annonces',
      avatarUrl: undefined,
      lastMessage: 'Nouvelle mise à jour de la bibliothèque disponible.',
      lastMessageAt: '2026-05-08T08:20:00.000Z',
      unreadCount: 2,
      isPinned: true,
      participants: [primaryUser],
    },
    {
      id: 'conv-amelie',
      type: 'direct',
      name: 'Amélie K.',
      avatarUrl: colleague.avatarUrl,
      lastMessage: 'Je t’envoie le PDF du TD avant 18h.',
      lastMessageAt: '2026-05-08T07:55:00.000Z',
      unreadCount: 1,
      isPinned: false,
      participants: [primaryUser, colleague],
    },
    {
      id: 'conv-group',
      type: 'group',
      name: 'Groupe Analyse',
      avatarUrl: groupUser.avatarUrl,
      lastMessage: 'La réunion est confirmée pour ce soir.',
      lastMessageAt: '2026-05-07T19:15:00.000Z',
      unreadCount: 0,
      isPinned: false,
      participants: [primaryUser, colleague, groupUser],
    },
  ] as Conversation[],
  messages: {
    'conv-announcement': [
      {
        id: 'msg-ann-1',
        conversationId: 'conv-announcement',
        senderId: 'user-primary',
        content: 'Bienvenue sur PipoLink. La bibliothèque est désormais synchronisée.',
        type: 'text',
        status: 'read',
        createdAt: '2026-05-08T08:00:00.000Z',
      },
      {
        id: 'msg-ann-2',
        conversationId: 'conv-announcement',
        senderId: 'user-primary',
        content: 'Un pack de documents a été ajouté dans Maths / Analyse.',
        type: 'text',
        status: 'delivered',
        createdAt: '2026-05-08T08:20:00.000Z',
      },
    ],
    'conv-amelie': [
      {
        id: 'msg-1',
        conversationId: 'conv-amelie',
        senderId: 'user-amelie',
        content: 'Voici le plan du TD. Dis-moi si tu veux que je le partage au groupe.',
        type: 'text',
        status: 'read',
        createdAt: '2026-05-08T07:35:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-amelie',
        senderId: 'user-primary',
        content: 'Parfait, merci !',
        type: 'text',
        status: 'delivered',
        createdAt: '2026-05-08T07:45:00.000Z',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-amelie',
        senderId: 'user-amelie',
        content: 'Je t’envoie le PDF du TD avant 18h.',
        type: 'text',
        status: 'sent',
        createdAt: '2026-05-08T07:55:00.000Z',
      },
    ],
    'conv-group': [
      {
        id: 'msg-4',
        conversationId: 'conv-group',
        senderId: 'user-omar',
        content: 'La réunion est confirmée pour ce soir.',
        type: 'text',
        status: 'read',
        createdAt: '2026-05-07T19:15:00.000Z',
      },
    ],
  } as Record<string, Message[]>,
  folders: [
    { id: 'folder-root-maths', parentId: null, name: 'Maths', documentCount: 12, color: '#FF7A00' },
    { id: 'folder-root-physique', parentId: null, name: 'Physique', documentCount: 4, color: '#3B82F6' },
    { id: 'folder-analyse', parentId: 'folder-root-maths', name: 'Analyse', documentCount: 7, color: '#F97316' },
    { id: 'folder-algebre', parentId: 'folder-root-maths', name: 'Algèbre', documentCount: 5, color: '#8B5CF6' },
  ] as Folder[],
  documents: [
    {
      id: 'doc-1',
      folderId: 'folder-analyse',
      title: 'CC Analyse Complexe 2024.pdf',
      type: 'CC',
      niveau: 'Licence 3',
      ue: 'Analyse',
      annee: 2024,
      description: 'Contrôle continu avec correction détaillée.',
      fileUrl: 'https://example.com/docs/cc-analyse-2024.pdf',
      size: 2400000,
      downloadCount: 47,
      uploadedBy: primaryUser.id,
      createdAt: '2026-05-04T13:10:00.000Z',
    },
    {
      id: 'doc-2',
      folderId: 'folder-analyse',
      title: 'TD Suites et séries.pdf',
      type: 'TD',
      niveau: 'Licence 2',
      ue: 'Analyse',
      annee: 2023,
      description: 'Exercices corrigés pour révision rapide.',
      fileUrl: 'https://example.com/docs/td-suites.pdf',
      size: 980000,
      downloadCount: 21,
      uploadedBy: colleague.id,
      createdAt: '2026-05-05T09:30:00.000Z',
    },
  ] as DocumentItem[],
  devices: [
    {
      id: 'device-primary',
      name: 'iPhone 14 Pro Max',
      platform: 'ios',
      isPrimary: true,
      lastActiveAt: '2026-05-08T08:25:00.000Z',
      linkedAt: '2026-05-01T08:00:00.000Z',
    },
    {
      id: 'device-mac',
      name: 'MacBook Pro',
      platform: 'desktop',
      isPrimary: false,
      lastActiveAt: '2026-05-08T06:00:00.000Z',
      linkedAt: '2026-05-03T10:00:00.000Z',
    },
    {
      id: 'device-samsung',
      name: 'Samsung Galaxy S23',
      platform: 'android',
      isPrimary: false,
      lastActiveAt: '2026-05-07T09:00:00.000Z',
      linkedAt: '2026-05-06T12:00:00.000Z',
    },
  ] as Device[],
  aiSessions: [
    { id: 'ai-1', title: 'Résumé document CC', updatedAt: '2026-05-07T17:00:00.000Z' },
    { id: 'ai-2', title: 'Plan de révision', updatedAt: '2026-05-06T12:00:00.000Z' },
  ] as AISession[],
  notifications: [
    {
      id: 'notif-1',
      title: 'Synchronisation terminée',
      body: 'Vos conversations ont été mises à jour hors ligne.',
      kind: 'success',
      createdAt: '2026-05-08T08:10:00.000Z',
      read: false,
    },
  ] as NotificationItem[],
  update: {
    version: '1.1.0',
    buildNumber: 43,
    changelog: ['Amélioration des performances de chat', 'Meilleure gestion hors ligne', 'Corrections UI'],
    size: '12.4 MB',
    downloadUrl: 'https://example.com/update',
  } as UpdateMetadata,
};
