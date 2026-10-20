import { runMigrations, type Migration, type SqlDatabase } from '../migrator';

class FakeDb implements SqlDatabase {
  versions: number[] = [];
  log: string[] = [];
  failOn: string | null = null;

  async execAsync(sql: string) {
    if (this.failOn && sql === this.failOn) throw new Error('boom');
    this.log.push(sql.trim().split('\n')[0]);
  }
  async runAsync(sql: string, ...params: unknown[]) {
    if (sql.startsWith('INSERT INTO schema_version')) this.versions.push(params[0] as number);
    return { changes: 1, lastInsertRowId: 0 };
  }
  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (sql.includes('MAX(version)')) {
      const version = this.versions.length ? Math.max(...this.versions) : null;
      return { version } as T;
    }
    return null;
  }
  async getAllAsync<T>(): Promise<T[]> {
    return [];
  }
  async withTransactionAsync(task: () => Promise<void>) {
    const snapshot = [...this.versions];
    try {
      await task();
    } catch (error) {
      this.versions = snapshot;
      throw error;
    }
  }
}

const migration = (version: number, sql: string): Migration => ({
  version,
  name: `m${version}`,
  up: (db) => db.execAsync(sql),
});

describe('runMigrations', () => {
  it('applies pending migrations in version order and records them', async () => {
    const db = new FakeDb();

    const applied = await runMigrations(db, [migration(2, 'B'), migration(1, 'A')]);

    expect(applied).toEqual([1, 2]);
    expect(db.versions).toEqual([1, 2]);
    expect(db.log.filter((s) => s === 'A' || s === 'B')).toEqual(['A', 'B']);
  });

  it('skips migrations that were already applied', async () => {
    const db = new FakeDb();
    await runMigrations(db, [migration(1, 'A')]);

    const applied = await runMigrations(db, [migration(1, 'A'), migration(2, 'B')]);

    expect(applied).toEqual([2]);
    expect(db.log.filter((s) => s === 'A')).toHaveLength(1);
  });

  it('stops at a failing migration without recording it', async () => {
    const db = new FakeDb();
    db.failOn = 'B';

    await expect(runMigrations(db, [migration(1, 'A'), migration(2, 'B')])).rejects.toThrow('boom');
    expect(db.versions).toEqual([1]);
  });

  it('rejects duplicate versions', async () => {
    await expect(
      runMigrations(new FakeDb(), [migration(1, 'A'), migration(1, 'B')]),
    ).rejects.toThrow('Duplicate migration version 1');
  });
});
