/** The subset of the expo-sqlite async API that the app relies on. */
export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: any[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: any[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export interface Migration {
  version: number;
  name: string;
  up(db: SqlDatabase): Promise<void>;
}

/**
 * Applies migrations newer than the recorded schema version, each inside its own
 * transaction. Returns the versions applied in this run.
 */
export async function runMigrations(
  db: SqlDatabase,
  migrations: readonly Migration[],
): Promise<number[]> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  sorted.forEach((migration, index) => {
    if (index > 0 && sorted[index - 1].version === migration.version) {
      throw new Error(`Duplicate migration version ${migration.version}`);
    }
  });

  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL);',
  );
  const row = await db.getFirstAsync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version;',
  );
  const current = row?.version ?? 0;

  const applied: number[] = [];
  for (const migration of sorted) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?);',
        migration.version,
        new Date().toISOString(),
      );
    });
    applied.push(migration.version);
  }
  return applied;
}
