import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';

import { useServices } from '../../composition/AppContext';
import { formatDisplayDate } from '../../shared/dates/format';
import { strings } from '../../shared/i18n/strings';
import { AppText, Divider, Fab } from '../../shared/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/states';
import { radius, spacing, useTheme } from '../../shared/ui/theme';
import { useFocusedQuery } from '../../shared/ui/useFocusedQuery';
import type { Category } from '../domain/category';
import type { Transaction } from '../domain/transaction';
import { useSelectedMonth } from './MonthContext';
import { MonthSelector } from './MonthSelector';
import { useMoney } from './useMoney';

export function TransactionsScreen() {
  const services = useServices();
  const theme = useTheme();
  const money = useMoney();
  const { month } = useSelectedMonth();

  const loader = useCallback(() => services.finance.listMonthTransactions(month), [services, month]);
  const { data, error, loading, reload } = useFocusedQuery(loader);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return <LoadingState />;

  const sections = data.groups.map((group) => ({ title: group.date, data: group.transactions }));

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<MonthSelector locale={money.locale} />}
        ListEmptyComponent={<EmptyState message={strings.transactions.empty} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="caption" style={styles.sectionHeader}>
            {formatDisplayDate(section.title, money.locale)}
          </AppText>
        )}
        renderItem={({ item, index, section }) => (
          <TransactionRow
            transaction={item}
            category={data.categoriesById[item.categoryId]}
            amount={money.format(item.amount)}
            first={index === 0}
            last={index === section.data.length - 1}
          />
        )}
      />
      <Fab
        accessibilityLabel={strings.transactions.add}
        onPress={() => router.push('/transaction/new')}
      />
    </View>
  );
}

function TransactionRow({
  transaction,
  category,
  amount,
  first,
  last,
}: {
  transaction: Transaction;
  category: Category | undefined;
  amount: string;
  first: boolean;
  last: boolean;
}) {
  const theme = useTheme();
  const isIncome = transaction.kind === 'income';
  return (
    <View
      style={[
        { backgroundColor: theme.card },
        first && styles.firstRow,
        last && styles.lastRow,
      ]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: transaction.id } })}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
        <AppText style={styles.icon}>{category?.icon ?? '•'}</AppText>
        <View style={styles.flex}>
          <AppText numberOfLines={1}>
            {transaction.description || category?.name || strings.transactions.noDescription}
          </AppText>
          <AppText variant="caption">
            {category?.name} · {strings.transactions.paymentMethods[transaction.paymentMethod]}
          </AppText>
        </View>
        <AppText variant="headline" color={isIncome ? theme.success : theme.text}>
          {isIncome ? '+' : '−'}
          {amount}
        </AppText>
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
  sectionHeader: { textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { fontSize: 24 },
  firstRow: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  lastRow: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  dividerInset: { marginLeft: 52 },
});
