import { systemClock, type Clock } from '../shared/dates/clock';
import type { MonthKey } from '../shared/dates/isoDate';
import type { SqlDatabase } from '../shared/db/migrator';
import { strings } from '../shared/i18n/strings';
import { createId, type IdGenerator } from '../shared/ids/ids';
import type { MinorUnits } from '../shared/money/money';
import type { ReminderScheduler } from '../shared/notifications/ReminderScheduler';
import { getCurrency, setCurrency } from '../finance/application/currency';
import { deleteTransaction } from '../finance/application/deleteTransaction';
import { getMonthOverview } from '../finance/application/getMonthOverview';
import { getTransaction } from '../finance/application/getTransaction';
import { listCategories } from '../finance/application/listCategories';
import { listMonthTransactions } from '../finance/application/listMonthTransactions';
import type { PendingInvoiceTracker } from '../finance/application/ports';
import { saveTransaction, type SaveTransactionInput } from '../finance/application/saveTransaction';
import { setCategoryBudget } from '../finance/application/setCategoryBudget';
import type { CategoryKind } from '../finance/domain/category';
import {
  SqliteCategoryRepository,
  SqliteSettingsRepository,
  SqliteTransactionRepository,
} from '../finance/infrastructure/sqliteRepositories';
import { cancelPendingInvoice } from '../invoices/application/cancelPendingInvoice';
import { countPendingInvoices } from '../invoices/application/countPendingInvoices';
import type { InvoiceDeps } from '../invoices/application/deps';
import { getInvoice } from '../invoices/application/getInvoice';
import { getInvoiceForTransaction } from '../invoices/application/getInvoiceForTransaction';
import { listInvoices } from '../invoices/application/listInvoices';
import type { AttachmentStorage } from '../invoices/application/ports';
import { receiveInvoice, type ReceiveInvoiceInput } from '../invoices/application/receiveInvoice';
import { removeInvoicesForTransaction } from '../invoices/application/removeInvoicesForTransaction';
import { upsertPendingInvoice } from '../invoices/application/upsertPendingInvoice';
import type { InvoiceStatus } from '../invoices/domain/invoice';
import { SqliteInvoiceRepository } from '../invoices/infrastructure/SqliteInvoiceRepository';

export interface AppAdapters {
  db: SqlDatabase;
  scheduler: ReminderScheduler;
  attachments: AttachmentStorage;
  deviceCurrency: string | null;
  clock?: Clock;
  newId?: IdGenerator;
}

/** Wires ports to adapters and exposes use cases bound to their dependencies. */
export function createAppServices(adapters: AppAdapters) {
  const clock = adapters.clock ?? systemClock;
  const newId = adapters.newId ?? createId;

  const categories = new SqliteCategoryRepository(adapters.db);
  const transactions = new SqliteTransactionRepository(adapters.db);
  const settings = new SqliteSettingsRepository(adapters.db);

  const invoiceDeps: InvoiceDeps = {
    invoices: new SqliteInvoiceRepository(adapters.db),
    scheduler: adapters.scheduler,
    attachments: adapters.attachments,
    clock,
    newId,
    reminderContent: ({ description }) => ({
      title: strings.invoices.reminderTitle(description || strings.transactions.noDescription),
      body: strings.invoices.reminderBody,
    }),
  };

  const invoiceTracker: PendingInvoiceTracker = {
    setPending: async (input) => {
      await upsertPendingInvoice(invoiceDeps, input);
    },
    clearPending: (transactionId) => cancelPendingInvoice(invoiceDeps, transactionId),
    removeAllFor: (transactionId) => removeInvoicesForTransaction(invoiceDeps, transactionId),
  };

  const financeDeps = { transactions, categories, settings, invoices: invoiceTracker, clock, newId };

  return {
    finance: {
      saveTransaction: (input: SaveTransactionInput) => saveTransaction(financeDeps, input),
      deleteTransaction: (id: string) => deleteTransaction(financeDeps, id),
      getTransaction: (id: string) => getTransaction(financeDeps, id),
      listMonthTransactions: (month: MonthKey) => listMonthTransactions(financeDeps, month),
      getMonthOverview: (month: MonthKey) => getMonthOverview(financeDeps, month),
      listCategories: (kind?: CategoryKind) => listCategories(financeDeps, kind),
      setCategoryBudget: (id: string, budget: MinorUnits | null) =>
        setCategoryBudget(financeDeps, id, budget),
      getCurrency: () => getCurrency(financeDeps, adapters.deviceCurrency),
      setCurrency: (code: string) => setCurrency(financeDeps, code),
    },
    invoices: {
      list: (status: InvoiceStatus) => listInvoices(invoiceDeps, status),
      get: (id: string) => getInvoice(invoiceDeps, id),
      getForTransaction: (transactionId: string) =>
        getInvoiceForTransaction(invoiceDeps, transactionId),
      receive: (input: ReceiveInvoiceInput) => receiveInvoice(invoiceDeps, input),
      countPending: () => countPendingInvoices(invoiceDeps),
    },
  };
}

export type AppServices = ReturnType<typeof createAppServices>;
