import type { Message, MessageAttachment, MessageStatus, MessageType } from '@/shared/api/types';

type RawAttachment = Partial<MessageAttachment> & {
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
};

export type RawMessage = Partial<Message> & {
  chat_id?: string;
  sender_id?: string;
  cipher_text?: string;
  created_at?: string | Date;
  attachments?: RawAttachment[];
};

function normalizeAttachment(raw: RawAttachment): MessageAttachment {
  return {
    id: raw.id ?? '',
    fileUrl: raw.fileUrl ?? raw.file_url ?? '',
    iv: raw.iv ?? '',
    fileName: raw.fileName ?? raw.file_name ?? 'file',
    fileSize: raw.fileSize ?? raw.file_size ?? 0,
    mimeType: raw.mimeType ?? raw.mime_type ?? 'application/octet-stream',
  };
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) return value;
  return new Date().toISOString();
}

export function normalizeMessage(raw: RawMessage): Message {
  const createdAt = toIsoDate(raw.created_at);

  return {
    id: raw.id ?? '',
    chat_id: raw.chat_id ?? '',
    sender_id: raw.sender_id ?? '',
    cipherText: raw.cipherText ?? raw.cipher_text ?? '',
    iv: raw.iv ?? '',
    status: (raw.status ?? 'send') as MessageStatus,
    type: (raw.type ?? 'TEXT') as MessageType,
    created_at: createdAt,
    attachments: (raw.attachments ?? []).map(normalizeAttachment),
  };
}

export function sortMessagesAsc(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}
