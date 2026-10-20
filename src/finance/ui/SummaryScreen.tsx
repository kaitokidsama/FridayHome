import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useServices } from '../../composition/AppContext';
import { strings } from '../../shared/i18n/strings';
import { AppText, Card, Screen, SectionTitle } from '../../shared/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/states';
import { spacing, useTheme } from '../../shared/ui/theme';
import { useFocusedQuery } from '../../shared/ui/useFocusedQuery';
import { BudgetProgressRow } from './BudgetProgressRow';
import { useSelectedMonth } from './MonthContext';
import { MonthSelector } from './MonthSelector';
import { useMoney } from './useMoney';

export function SummaryScreen() {
  const services = useServices();
  const theme = useTheme();
  const money = useMoney();
  const { month } = useSelectedMonth();

  const loader = useCallback(async () => {
    const [overview, pendingCount] = await Promise.all([
      services.finance.getMonthOverview(month),
      services.invoices.countPending(),
    ]);
    return { ...overview, pendingCount };
  }, [services, month]);
  const { data, error, loading, reload } = useFocusedQuery(loader);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return <LoadingState />;

  const { summary, budgets, pendingCount } = data;

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
      <MonthSelector locale={money.locale} />

      <View style={styles.cards}>
        <Card style={styles.metric}>
          <AppText variant="caption">{strings.summary.income}</AppText>
          <AppText variant="headline" color={theme.success} adjustsFontSizeToFit numberOfLines={1}>
            {money.format(summary.totalIncome)}
          </AppText>
        </Card>
        <Card style={styles.metric}>
          <AppText variant="caption">{strings.summary.expenses}</AppText>
          <AppText variant="headline" color={theme.danger} adjustsFontSizeToFit numberOfLines={1}>
            {money.format(summary.totalExpenses)}
          </AppText>
        </Card>
      </View>
      <Card>
        <AppText variant="caption">{strings.summary.balance}</AppText>
        <AppText
          variant="largeTitle"
          color={summary.balance < 0 ? theme.danger : theme.text}
          adjustsFontSizeToFit
          numberOfLines={1}>
          {money.format(summary.balance)}
        </AppText>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.navigate('/invoices')}>
        <Card style={styles.invoiceCard}>
          <AppText>🧾</AppText>
          <AppText style={styles.flex}>
            {pendingCount > 0
              ? strings.summary.pendingInvoices(pendingCount)
              : strings.summary.noPendingInvoices}
          </AppText>
          <AppText color={theme.textSecondary}>›</AppText>
        </Card>
      </Pressable>

      <SectionTitle>{strings.summary.budgets}</SectionTitle>
      <Card>
        {budgets.length === 0 ? (
          <EmptyState message={strings.summary.noBudgets} />
        ) : (
          budgets.map((progress) => (
            <BudgetProgressRow key={progress.category.id} progress={progress} format={money.format} />
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1 },
  invoiceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
