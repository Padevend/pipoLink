import { db } from '@/shared/storage/sqlite';
import type { Conversation } from '@/shared/api/messaging';
import { normalizeConversation } from '@/shared/api/normalize-conversation';
import { normalizeMessage } from '@/shared/api/normalize-message';
import type { Message } from '@/shared/api/types';
import type { AiChatMessage, AiSession } from '@/shared/api/ai';

export type PendingMessageRow = {
  id: string;
  conversation_id: string;
  content_plain: string;
  message_type: string;
  created_at: string;
  retry_count: number;
};

export const localDb = {
  upsertConversations(items: Conversation[]): void {
    for (const raw of items) {
      const c = normalizeConversation(raw);
      db.runSync(
        `INSERT OR REPLACE INTO conversations (id, name, last_message, unread_count, updated_at, payload_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.name ? c.name : c.members.map((m) => m.username).join(', ') || 'Conversation',
          c.lastMessage?.cipherText?.slice(0, 80) ?? '',
          c.unreadCount,
          c.updatedAt,
          JSON.stringify(c),
        ],
      );
    }
  },

  getConversations(): Conversation[] {
    const rows = db.getAllSync<{ payload_json: string }>(
      'SELECT payload_json FROM conversations ORDER BY updated_at DESC',
    );
    return rows.map((r) => normalizeConversation(JSON.parse(r.payload_json) as Conversation));
  },

  upsertMessages(conversationId: string, items: Message[]): void {
    for (const raw of items) {
      const m = normalizeMessage({ ...raw, chat_id: raw.chat_id || conversationId });
      const attachmentsJson = JSON.stringify(m.attachments ?? []);
      db.runSync(
        `INSERT OR REPLACE INTO messages
         (id, conversation_id, content_encrypted, sender_id, created_at, status, iv, message_type, attachments_json, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          conversationId,
          m.cipherText,
          m.sender_id,
          m.created_at,
          m.status,
          m.iv,
          m.type,
          attachmentsJson,
          JSON.stringify(m),
        ],
      );
    }
  },

  getMessages(conversationId: string, limit = 200): Message[] {
    const rows = db.getAllSync<{ payload_json: string }>(
      `SELECT payload_json FROM messages WHERE conversation_id = ? ORDER BY datetime(created_at) ASC LIMIT ?`,
      [conversationId, limit],
    );
    return rows.map((r) => normalizeMessage(JSON.parse(r.payload_json) as Message));
  },

  queuePendingMessage(row: Omit<PendingMessageRow, 'retry_count'>): void {
    db.runSync(
      `INSERT OR REPLACE INTO pending_messages (id, conversation_id, content_plain, message_type, created_at, retry_count)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [row.id, row.conversation_id, row.content_plain, row.message_type, row.created_at],
    );
  },

  getPendingMessages(): PendingMessageRow[] {
    return db.getAllSync<PendingMessageRow>(
      'SELECT id, conversation_id, content_plain, message_type, created_at, retry_count FROM pending_messages ORDER BY created_at ASC',
    );
  },

  removePendingMessage(id: string): void {
    db.runSync('DELETE FROM pending_messages WHERE id = ?', [id]);
  },

  bumpPendingRetry(id: string): void {
    db.runSync('UPDATE pending_messages SET retry_count = retry_count + 1 WHERE id = ?', [id]);
  },

  upsertAiSessions(sessions: AiSession[]): void {
    for (const s of sessions) {
      db.runSync(
        'INSERT OR REPLACE INTO ai_sessions (id, title, created_at) VALUES (?, ?, ?)',
        [s.id, s.title, s.createdAt],
      );
    }
  },

  getAiSessions(): AiSession[] {
    return db.getAllSync<AiSession>(
      'SELECT id, title, created_at as createdAt FROM ai_sessions ORDER BY created_at DESC',
    );
  },

  upsertAiMessages(sessionId: string, messages: AiChatMessage[]): void {
    for (const m of messages) {
      db.runSync(
        'INSERT OR REPLACE INTO ai_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
        [m.id, sessionId, m.role, m.content, m.createdAt],
      );
    }
  },

  getAiMessages(sessionId: string): AiChatMessage[] {
    return db.getAllSync<AiChatMessage>(
      `SELECT id, role, content, created_at as createdAt FROM ai_messages WHERE session_id = ? ORDER BY created_at ASC`,
      [sessionId],
    );
  },

  upsertDocument(doc: {
    id: string;
    folder_id: string;
    title: string;
    type: string;
    size: number;
    local_uri?: string | null;
    download_count: number;
  }): void {
    db.runSync(
      `INSERT OR REPLACE INTO documents (id, folder_id, title, type, size, local_uri, download_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [doc.id, doc.folder_id, doc.title, doc.type, doc.size, doc.local_uri ?? null, doc.download_count],
    );
  },
};
