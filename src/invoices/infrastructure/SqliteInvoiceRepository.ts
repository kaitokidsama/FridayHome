import type { SqlDatabase } from '../../shared/db/migrator';
import type { InvoiceDetails, InvoiceRepository } from '../application/ports';
import type { Invoice, InvoiceStatus } from '../domain/invoice';

interface InvoiceRow {
  id: string;
  transaction_id: string;
  status: InvoiceStatus;
  expected_date: string | null;
  received_at: string | null;
  attachment_uri: string | null;
  notes: string | null;
  reminder_id: string | null;
}

interface InvoiceDetailsRow extends InvoiceRow {
  description: string;
  amount: number;
  transaction_date: string;
}

const COLUMNS =
  'i.id, i.transaction_id, i.status, i.expected_date, i.received_at, i.attachment_uri, i.notes, i.reminder_id';

const DETAILED_SELECT = `
  SELECT ${COLUMNS}, t.description AS description, t.amount AS amount, t.date AS transaction_date
  FROM invoices i
  JOIN transactions t ON t.id = i.transaction_id`;

const toInvoice = (row: InvoiceRow): Invoice => ({
  id: row.id,
  transactionId: row.transaction_id,
  status: row.status,
  expectedDate: row.expected_date,
  receivedAt: row.received_at,
  attachmentUri: row.attachment_uri,
  notes: row.notes,
  reminderId: row.reminder_id,
});

const toDetails = (row: InvoiceDetailsRow): InvoiceDetails => ({
  ...toInvoice(row),
  description: row.description,
  amount: row.amount,
  transactionDate: row.transaction_date,
});

export class SqliteInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: SqlDatabase) {}

  async insert(i: Invoice) {
    await this.db.runAsync(
      'INSERT INTO invoices (id, transaction_id, status, expected_date, received_at, attachment_uri, notes, reminder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      i.id,
      i.transactionId,
      i.status,
      i.expectedDate,
      i.receivedAt,
      i.attachmentUri,
      i.notes,
      i.reminderId,
    );
  }

  async update(i: Invoice) {
    await this.db.runAsync(
      'UPDATE invoices SET status = ?, expected_date = ?, received_at = ?, attachment_uri = ?, notes = ?, reminder_id = ? WHERE id = ?;',
      i.status,
      i.expectedDate,
      i.receivedAt,
      i.attachmentUri,
      i.notes,
      i.reminderId,
      i.id,
    );
  }

  async getById(id: string) {
    const row = await this.db.getFirstAsync<InvoiceRow>(
      `SELECT ${COLUMNS} FROM invoices i WHERE i.id = ?;`,
      id,
    );
    return row ? toInvoice(row) : null;
  }

  async findByTransactionId(transactionId: string) {
    const rows = await this.db.getAllAsync<InvoiceRow>(
      `SELECT ${COLUMNS} FROM invoices i WHERE i.transaction_id = ?;`,
      transactionId,
    );
    return rows.map(toInvoice);
  }

  async deleteById(id: string) {
    await this.db.runAsync('DELETE FROM invoices WHERE id = ?;', id);
  }

  async listDetailed() {
    const rows = await this.db.getAllAsync<InvoiceDetailsRow>(`${DETAILED_SELECT};`);
    return rows.map(toDetails);
  }

  async getDetailed(id: string) {
    const row = await this.db.getFirstAsync<InvoiceDetailsRow>(
      `${DETAILED_SELECT} WHERE i.id = ?;`,
      id,
    );
    return row ? toDetails(row) : null;
  }

  async countPending() {
    const row = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM invoices WHERE status = 'pending';",
    );
    return row?.count ?? 0;
  }
}
