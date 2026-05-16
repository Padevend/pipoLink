import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pipolink.db');

export async function initializeSqlite(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      content_encrypted TEXT NOT NULL,
      sender_id TEXT NOT NULL,
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
  `);

  await migrateSqliteColumns();
}

async function migrateSqliteColumns(): Promise<void> {
  const messageCols = db.getAllSync<{ name: string }>('PRAGMA table_info(messages)');
  const names = new Set(messageCols.map((c) => c.name));
  if (!names.has('iv')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN iv TEXT NOT NULL DEFAULT ''`);
  }
  if (!names.has('message_type')) {
    await db.execAsync(`ALTER TABLE messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'TEXT'`);
  }

  const convCols = db.getAllSync<{ name: string }>('PRAGMA table_info(conversations)');
  if (!convCols.some((c) => c.name === 'payload_json')) {
    await db.execAsync(`ALTER TABLE conversations ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}'`);
  }
}

export { db };
