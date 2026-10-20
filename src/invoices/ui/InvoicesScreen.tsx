import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useServices } from '../../composition/AppContext';
import { formatShortDate, formatTimestampDate } from '../../shared/dates/format';
import { strings } from '../../shared/i18n/strings';
import { AppText, Badge, Divider, SegmentedControl } from '../../shared/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/states';
import { radius, spacing, useTheme } from '../../shared/ui/theme';
import { useFocusedQuery } from '../../shared/ui/useFocusedQuery';
import { useMoney } from '../../finance/ui/useMoney';
import type { InvoiceListItem } from '../application/listInvoices';
import type { InvoiceStatus } from '../domain/invoice';

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: 'pending', label: strings.invoices.pending },
  { value: 'received', label: strings.invoices.received },
];

export function InvoicesScreen() {
  const services = useServices();
  const theme = useTheme();
  const [status, setStatus] = useState<InvoiceStatus>('pending');
  const loader = useCallback(() => services.invoices.list(status), [services, status]);
  const { data, error, loading, reload } = useFocusedQuery(loader);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && data !== null} onRefresh={reload} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl options={statusOptions} value={status} onChange={(next) => setStatus(next)} />
          </View>
        }
        ListEmptyComponent={
          data === null ? (
            <LoadingState />
          ) : (
            <EmptyState
              message={
                status === 'pending' ? strings.invoices.emptyPending : strings.invoices.emptyReceived
              }
            />
          )
        }
        renderItem={({ item, index }) => (
          <InvoiceRow
            invoice={item}
            first={index === 0}
            last={index === (data?.length ?? 0) - 1}
          />
        )}
      />
    </View>
  );
}

function InvoiceRow({
  invoice,
  first,
  last,
}: {
  invoice: InvoiceListItem;
  first: boolean;
  last: boolean;
}) {
  const theme = useTheme();
  const money = useMoney();
  const subtitle =
    invoice.status === 'received' && invoice.receivedAt
      ? strings.invoices.receivedOn(formatTimestampDate(invoice.receivedAt, money.locale))
      : invoice.expectedDate
        ? strings.invoices.expectedOn(formatShortDate(invoice.expectedDate, money.locale))
        : strings.invoices.noExpectedDate;

  return (
    <View
      style={[
        { backgroundColor: theme.card },
        first && styles.firstRow,
        last && styles.lastRow,
      ]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: invoice.id } })}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
        <View style={styles.flex}>
          <AppText numberOfLines={1}>
            {invoice.description || strings.transactions.noDescription}
          </AppText>
          <AppText variant="caption" color={invoice.overdue ? theme.danger : undefined}>
            {subtitle}
          </AppText>
        </View>
        <View style={styles.trailing}>
          <AppText variant="headline">{money.format(invoice.amount)}</AppText>
          {invoice.overdue ? <Badge label={strings.invoices.overdue} color={theme.danger} /> : null}
        </View>
      </Pressable>
      {!last ? (
        <View style={styles.dividerInset}>
          <Divider />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  header: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  firstRow: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  lastRow: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  dividerInset: { marginLeft: spacing.md },
});
