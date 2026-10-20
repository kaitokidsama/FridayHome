import { DEFAULT_CATEGORY_SEEDS } from '../../finance/domain/category';
import { strings } from '../i18n/strings';
import type { Migration } from './migrator';

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    up: (db) =>
      db.execAsync(`
        CREATE TABLE categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
          monthly_budget INTEGER CHECK (monthly_budget IS NULL OR monthly_budget >= 0),
          sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE transactions (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
          amount INTEGER NOT NULL CHECK (amount > 0),
          category_id TEXT NOT NULL REFERENCES categories(id),
          date TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
          created_at TEXT NOT NULL
        );
        CREATE INDEX idx_transactions_date ON transactions(date);

        CREATE TABLE invoices (
          id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
          status TEXT NOT NULL CHECK (status IN ('pending', 'received')),
          expected_date TEXT,
          received_at TEXT,
          attachment_uri TEXT,
          notes TEXT,
          reminder_id TEXT
        );
        CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);
        CREATE INDEX idx_invoices_status ON invoices(status);

        CREATE TABLE settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `),
  },
  {
    version: 2,
    name: 'seed default categories',
    up: async (db) => {
      for (const [index, seed] of DEFAULT_CATEGORY_SEEDS.entries()) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, icon, kind, monthly_budget, sort_order) VALUES (?, ?, ?, ?, NULL, ?);',
          seed.key,
          strings.categories[seed.key],
          seed.icon,
          seed.kind,
          index,
        );
      }
    },
  },
];
