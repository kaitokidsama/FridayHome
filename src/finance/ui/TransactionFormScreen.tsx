import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useServices } from '../../composition/AppContext';
import { toIsoDate, type IsoDate } from '../../shared/dates/isoDate';
import { strings } from '../../shared/i18n/strings';
import { parseAmountToMinorUnits, toMajorUnitsString } from '../../shared/money/money';
import { DateField } from '../../shared/ui/DateField';
import {
  AppText,
  Button,
  Card,
  FieldError,
  FieldLabel,
  Screen,
  SegmentedControl,
  SwitchRow,
  TextField,
} from '../../shared/ui/primitives';
import { ErrorState, LoadingState } from '../../shared/ui/states';
import { spacing, useTheme } from '../../shared/ui/theme';
import type { SaveTransactionError } from '../application/saveTransaction';
import type { Category } from '../domain/category';
import {
  PAYMENT_METHODS,
  TRANSACTION_KINDS,
  type PaymentMethod,
  type TransactionKind,
} from '../domain/transaction';
import { CategoryPicker } from './CategoryPicker';
import { useMoney } from './useMoney';

interface FormState {
  kind: TransactionKind;
  amountText: string;
  categoryId: string;
  date: IsoDate;
  description: string;
  paymentMethod: PaymentMethod;
  invoicePending: boolean;
  expectedDate: IsoDate;
}

interface Loaded {
  categories: Category[];
  invoiceReceived: boolean;
}

const kindOptions = TRANSACTION_KINDS.map((value) => ({
  value,
  label: strings.transactions.kind[value],
}));
const paymentOptions = PAYMENT_METHODS.map((value) => ({
  value,
  label: strings.transactions.paymentMethods[value],
}));

export function TransactionFormScreen({ id }: { id?: string }) {
  const services = useServices();
  const money = useMoney();
  const theme = useTheme();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<SaveTransactionError[]>([]);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const categories = await services.finance.listCategories();
      const today = toIsoDate(new Date());
      const existing = id ? await services.finance.getTransaction(id) : null;
      if (id && !existing) throw new Error(`Transaction ${id} not found`);
      const invoice = existing ? await services.invoices.getForTransaction(existing.id) : null;

      const kind = existing?.kind ?? 'expense';
      const initial: FormState = {
        kind,
        amountText: existing ? toMajorUnitsString(existing.amount, money.fractionDigits) : '',
        categoryId: existing?.categoryId ?? categories.find((c) => c.kind === kind)?.id ?? '',
        date: existing?.date ?? today,
        description: existing?.description ?? '',
        paymentMethod: existing?.paymentMethod ?? 'debit',
        invoicePending: invoice?.status === 'pending',
        expectedDate: invoice?.expectedDate ?? today,
      };
      setLoaded({ categories, invoiceReceived: invoice?.status === 'received' });
      setForm(initial);
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught : new Error(String(caught)));
    }
  }, [services, id, money.fractionDigits]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadError) return <ErrorState message={loadError.message} />;
  if (!loaded || !form) return <LoadingState />;

  const update = (patch: Partial<FormState>) => setForm({ ...form, ...patch });
  const categoriesForKind = loaded.categories.filter((c) => c.kind === form.kind);
  const errorFor = (field: SaveTransactionError) =>
    errors.includes(field) ? strings.transactions.errors[field] : null;

  const changeKind = (kind: TransactionKind) => {
    if (kind === form.kind) return;
    update({ kind, categoryId: loaded.categories.find((c) => c.kind === kind)?.id ?? '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await services.finance.saveTransaction({
        id,
        draft: {
          kind: form.kind,
          amount: parseAmountToMinorUnits(form.amountText, money.fractionDigits) ?? 0,
          categoryId: form.categoryId,
          date: form.date,
          description: form.description,
          paymentMethod: form.paymentMethod,
        },
        invoice: { pending: form.invoicePending, expectedDate: form.expectedDate },
      });
      if (result.ok) router.back();
      else setErrors(result.errors);
    } catch (caught) {
      Alert.alert(strings.common.error, caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!id) return;
    Alert.alert(strings.transactions.deleteConfirmTitle, strings.transactions.deleteConfirmMessage, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.delete,
        style: 'destructive',
        onPress: async () => {
          await services.finance.deleteTransaction(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: id ? strings.transactions.editTitle : strings.transactions.newTitle,
          headerLeft: () => (
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
              <AppText color={theme.primary}>{strings.common.cancel}</AppText>
            </Pressable>
          ),
        }}
      />
      <Screen>
        <SegmentedControl options={kindOptions} value={form.kind} onChange={changeKind} />

        <Card>
          <FieldLabel>{`${strings.transactions.amount} (${money.currency})`}</FieldLabel>
          <TextField
            value={form.amountText}
            onChangeText={(amountText) => update({ amountText })}
            placeholder={money.fractionDigits === 0 ? '0' : strings.transactions.amountPlaceholder}
            keyboardType={money.fractionDigits === 0 ? 'number-pad' : 'decimal-pad'}
            accessibilityLabel={strings.transactions.amount}
            style={styles.amount}
            autoFocus={!id}
          />
          <FieldError message={errorFor('amount')} />
        </Card>

        <Card>
          <FieldLabel>{strings.transactions.category}</FieldLabel>
          <CategoryPicker
            categories={categoriesForKind}
            value={form.categoryId}
            onChange={(categoryId) => update({ categoryId })}
          />
          <FieldError message={errorFor('categoryId')} />
        </Card>

        <Card>
          <View style={styles.inline}>
            <AppText style={styles.flex}>{strings.transactions.date}</AppText>
            <DateField
              value={form.date}
              onChange={(date) => update({ date })}
              locale={money.locale}
              accessibilityLabel={strings.transactions.date}
            />
          </View>
          <FieldError message={errorFor('date')} />

          <FieldLabel>{strings.transactions.description}</FieldLabel>
          <TextField
            value={form.description}
            onChangeText={(description) => update({ description })}
            placeholder={strings.transactions.descriptionPlaceholder}
            accessibilityLabel={strings.transactions.description}
            returnKeyType="done"
          />

          <FieldLabel>{strings.transactions.paymentMethod}</FieldLabel>
          <SegmentedControl
            options={paymentOptions}
            value={form.paymentMethod}
            onChange={(paymentMethod) => update({ paymentMethod })}
          />
        </Card>

        {form.kind === 'expense' ? (
          <Card>
            {loaded.invoiceReceived ? (
              <AppText variant="caption">{strings.transactions.invoiceReceivedNote}</AppText>
            ) : (
              <>
                <SwitchRow
                  label={strings.transactions.invoicePending}
                  hint={strings.transactions.invoicePendingHint}
                  value={form.invoicePending}
                  onValueChange={(invoicePending) => update({ invoicePending })}
                />
                {form.invoicePending ? (
                  <View style={styles.inline}>
                    <AppText style={styles.flex}>{strings.transactions.expectedDate}</AppText>
                    <DateField
                      value={form.expectedDate}
                      onChange={(expectedDate) => update({ expectedDate })}
                      locale={money.locale}
                      accessibilityLabel={strings.transactions.expectedDate}
                    />
                  </View>
                ) : null}
                <FieldError message={errorFor('expectedDate')} />
              </>
            )}
          </Card>
        ) : null}

        <Button title={strings.common.save} onPress={save} disabled={saving} />
        {id ? (
          <Button title={strings.common.delete} onPress={confirmDelete} variant="destructive" />
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  amount: { fontSize: 28, fontWeight: '600' },
});
