import type { Clock } from '../../shared/dates/clock';
import { isIsoDate, type IsoDate } from '../../shared/dates/isoDate';
import type { IdGenerator } from '../../shared/ids/ids';
import {
  validateTransactionDraft,
  type Transaction,
  type TransactionDraft,
  type TransactionField,
} from '../domain/transaction';
import type { CategoryRepository, PendingInvoiceTracker, TransactionRepository } from './ports';

export interface SaveTransactionDeps {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  invoices: PendingInvoiceTracker;
  newId: IdGenerator;
  clock: Clock;
}

export interface InvoiceOption {
  pending: boolean;
  expectedDate: IsoDate | null;
}

export interface SaveTransactionInput {
  /** When present, the existing transaction is updated. */
  id?: string;
  draft: TransactionDraft;
  invoice: InvoiceOption;
}

export type SaveTransactionError = TransactionField | 'expectedDate';

export type SaveTransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; errors: SaveTransactionError[] };

export async function saveTransaction(
  deps: SaveTransactionDeps,
  input: SaveTransactionInput,
): Promise<SaveTransactionResult> {
  const draft: TransactionDraft = { ...input.draft, description: input.draft.description.trim() };
  const errors = await validate(deps, draft, input.invoice);
  if (errors.length > 0) return { ok: false, errors };

  const transaction = input.id
    ? await updateExisting(deps, input.id, draft)
    : await createNew(deps, draft);

  const tracksInvoice = transaction.kind === 'expense' && input.invoice.pending;
  if (tracksInvoice) {
    await deps.invoices.setPending({
      transactionId: transaction.id,
      description: transaction.description,
      expectedDate: input.invoice.expectedDate,
    });
  } else if (input.id) {
    await deps.invoices.clearPending(transaction.id);
  }

  return { ok: true, transaction };
}

async function validate(
  deps: SaveTransactionDeps,
  draft: TransactionDraft,
  invoice: InvoiceOption,
): Promise<SaveTransactionError[]> {
  const errors: SaveTransactionError[] = validateTransactionDraft(draft);
  if (!errors.includes('categoryId')) {
    const category = await deps.categories.getById(draft.categoryId);
    if (!category || category.kind !== draft.kind) errors.push('categoryId');
  }
  const expectedDate = invoice.expectedDate;
  const checksDate = draft.kind === 'expense' && invoice.pending && expectedDate !== null;
  if (checksDate && !isIsoDate(expectedDate)) errors.push('expectedDate');
  return errors;
}

async function createNew(deps: SaveTransactionDeps, draft: TransactionDraft) {
  const transaction: Transaction = {
    ...draft,
    id: deps.newId(),
    createdAt: deps.clock.now().toISOString(),
  };
  await deps.transactions.insert(transaction);
  return transaction;
}

async function updateExisting(deps: SaveTransactionDeps, id: string, draft: TransactionDraft) {
  const existing = await deps.transactions.getById(id);
  if (!existing) throw new Error(`Transaction ${id} not found`);
  const transaction: Transaction = { ...draft, id, createdAt: existing.createdAt };
  await deps.transactions.update(transaction);
  return transaction;
}
