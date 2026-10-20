import { monthRange, type MonthKey } from '../../shared/dates/isoDate';
import type { SqlDatabase } from '../../shared/db/migrator';
import type { MinorUnits } from '../../shared/money/money';
import type {
  CategoryRepository,
  SettingsRepository,
  TransactionRepository,
} from '../application/ports';
import type { Category, CategoryKind } from '../domain/category';
import type { PaymentMethod, Transaction, TransactionKind } from '../domain/transaction';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  kind: CategoryKind;
  monthly_budget: number | null;
}

interface TransactionRow {
  id: string;
  kind: TransactionKind;
  amount: number;
  category_id: string;
  date: string;
  description: string;
  payment_method: PaymentMethod;
  created_at: string;
}

const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  kind: row.kind,
  monthlyBudget: row.monthly_budget,
});

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  kind: row.kind,
  amount: row.amount,
  categoryId: row.category_id,
  date: row.date,
  description: row.description,
  paymentMethod: row.payment_method,
  createdAt: row.created_at,
});

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: SqlDatabase) {}

  async list() {
    const rows = await this.db.getAllAsync<CategoryRow>(
      'SELECT id, name, icon, kind, monthly_budget FROM categories ORDER BY sort_order, name;',
    );
    return rows.map(toCategory);
  }

  async getById(id: string) {
    const row = await this.db.getFirstAsync<CategoryRow>(
      'SELECT id, name, icon, kind, monthly_budget FROM categories WHERE id = ?;',
      id,
    );
    return row ? toCategory(row) : null;
  }

  async updateBudget(id: string, monthlyBudget: MinorUnits | null) {
    await this.db.runAsync('UPDATE categories SET monthly_budget = ? WHERE id = ?;', monthlyBudget, id);
  }
}

const TRANSACTION_COLUMNS =
  'id, kind, amount, category_id, date, description, payment_method, created_at';

export class SqliteTransactionRepository implements TransactionRepository {
  constructor(private readonly db: SqlDatabase) {}

  async listByMonth(month: MonthKey) {
    const { start, end } = monthRange(month);
    const rows = await this.db.getAllAsync<TransactionRow>(
      `SELECT ${TRANSACTION_COLUMNS} FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC, created_at DESC;`,
      start,
      end,
    );
    return rows.map(toTransaction);
  }

  async getById(id: string) {
    const row = await this.db.getFirstAsync<TransactionRow>(
      `SELECT ${TRANSACTION_COLUMNS} FROM transactions WHERE id = ?;`,
      id,
    );
    return row ? toTransaction(row) : null;
  }

  async insert(t: Transaction) {
    await this.db.runAsync(
      `INSERT INTO transactions (${TRANSACTION_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      t.id,
      t.kind,
      t.amount,
      t.categoryId,
      t.date,
      t.description,
      t.paymentMethod,
      t.createdAt,
    );
  }

  async update(t: Transaction) {
    await this.db.runAsync(
      'UPDATE transactions SET kind = ?, amount = ?, category_id = ?, date = ?, description = ?, payment_method = ? WHERE id = ?;',
      t.kind,
      t.amount,
      t.categoryId,
      t.date,
      t.description,
      t.paymentMethod,
      t.id,
    );
  }

  async delete(id: string) {
    await this.db.runAsync('DELETE FROM transactions WHERE id = ?;', id);
  }
}

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: SqlDatabase) {}

  async get(key: string) {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?;',
      key,
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string) {
    await this.db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
      key,
      value,
    );
  }
}
