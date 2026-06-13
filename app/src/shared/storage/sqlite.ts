import * as SQLite from 'expo-sqlite';
import { exists } from 'i18next';

const db = SQLite.openDatabaseSync('pipolink.db');

export async function initializeSqlite(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      content_encrypted TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      response_id TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      iv TEXT NOT NULL DEFAULT '',
      message_type TEXT NOT NULL DEFAULT 'TEXT'
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      last_message TEXT NOT NULL,
      unread_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS pending_messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      content_plain TEXT NOT NULL,
      message_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ai_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      folder_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      local_uri TEXT,
      download_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      document_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      remote_uri TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      mineType TEXT,
      progress REAL DEFAULT 0,
      totalBytes INTEGER DEFAULT 0,
      writtenBytes INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      resume_data TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const columns = await db.getAllSync(
    `PRAGMA table_info(downloads)`,
  );

  const exists = columns.some(
    (column: any) => column.name === "mineType"
  )

  if (exists) {
    await db.execAsync(`
      ALTER TABLE downloads RENAME COLUMN mineType TO mimeType;
    `);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attachment_downloads (
      id TEXT PRIMARY KEY NOT NULL,
      message_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      encrypted_url TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      file_size INTEGER NOT NULL DEFAULT 0,
      iv TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'idle',
      progress REAL NOT NULL DEFAULT 0,
      total_bytes INTEGER NOT NULL DEFAULT 0,
      written_bytes INTEGER NOT NULL DEFAULT 0,
      encrypted_local_uri TEXT,
      decrypted_local_uri TEXT,
      resume_data TEXT,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await migrateSqliteColumns();
}

/**
 * Safely adds columns to existing tables without breaking installs that
 * already have the base schema. Each ALTER TABLE is wrapped in its own
 * guard so a partial migration never leaves the DB in a bad state.
 */
async function migrateSqliteColumns(): Promise<void> {
  const messageCols = db.getAllSync<{ name: string }>('PRAGMA table_info(messages)');
  const names = new Set(messageCols.map((c) => c.name));

  if (!names.has('iv')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN iv TEXT NOT NULL DEFAULT ''`);
  }
  if (!names.has('message_type')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'TEXT'`);
  }
  if (!names.has('attachments_json')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN attachments_json TEXT NOT NULL DEFAULT '[]'`);
  }
  if (!names.has('payload_json')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}'`);
  }

  const convCols = db.getAllSync<{ name: string }>('PRAGMA table_info(conversations)');
  if (!convCols.some((c) => c.name === 'payload_json')) {
    await db.execAsync(`ALTER TABLE conversations ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}'`);
  }

  // Migrate old attachements table rows into the new attachment_downloads table
  // so existing users don't lose their cached downloads.
  const tables = db.getAllSync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='attachements'`,
  );
  if (tables.length > 0) {
    await db.execAsync(`
      INSERT OR IGNORE INTO attachment_downloads
        (id, message_id, chat_id, encrypted_url, filename, mime_type, file_size, iv,
         status, progress, total_bytes, written_bytes,
         encrypted_local_uri, decrypted_local_uri, resume_data, error_message,
         created_at, updated_at)
      SELECT
        id,
        '' AS message_id,
        '' AS chat_id,
        encrypted_url,
        filename,
        mime_type,
        0 AS file_size,
        '' AS iv,
        CASE WHEN downloaded = 1 THEN 'completed' ELSE 'idle' END AS status,
        CASE WHEN downloaded = 1 THEN 1.0 ELSE 0 END AS progress,
        0 AS total_bytes,
        0 AS written_bytes,
        NULL AS encrypted_local_uri,
        decrypted_local_uri,
        NULL AS resume_data,
        NULL AS error_message,
        created_at,
        created_at AS updated_at
      FROM attachements;
    `);
    // Leave old table in place; it will just be unused going forward.
  }
}

export { db };
