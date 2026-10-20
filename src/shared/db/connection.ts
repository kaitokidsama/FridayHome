import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './migrations';
import { runMigrations } from './migrator';

export const DATABASE_NAME = 'friday-home.db';

let opening: Promise<SQLiteDatabase> | null = null;

/** Opens the app database once, enabling foreign keys and applying migrations. */
export function openAppDatabase(): Promise<SQLiteDatabase> {
  if (!opening) {
    opening = (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await runMigrations(db, migrations);
      return db;
    })().catch((error) => {
      opening = null;
      throw error;
    });
  }
  return opening;
}
