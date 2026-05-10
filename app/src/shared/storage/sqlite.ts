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
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      last_message TEXT NOT NULL,
      unread_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
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
}

export { db };
