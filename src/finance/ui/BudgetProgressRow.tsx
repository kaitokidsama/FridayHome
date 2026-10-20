import { StyleSheet, View } from 'react-native';

import { strings } from '../../shared/i18n/strings';
import type { MinorUnits } from '../../shared/money/money';
import { AppText, ProgressBar } from '../../shared/ui/primitives';
import { spacing, useTheme } from '../../shared/ui/theme';
import type { CategoryBudgetProgress } from '../domain/summary';

export function BudgetProgressRow({
  progress,
  format,
}: {
  progress: CategoryBudgetProgress;
  format(amount: MinorUnits): string;
}) {
  const theme = useTheme();
  const { category, spent, budget, percentage, overBudget } = progress;
  const color = overBudget ? theme.danger : (percentage ?? 0) >= 85 ? theme.warning : theme.primary;
  const detail =
    budget === null
      ? strings.summary.spentNoBudget(format(spent))
      : strings.summary.spentOfBudget(format(spent), format(budget));

  return (
    <View style={styles.row} accessibilityLabel={`${category.name}: ${detail}`}>
      <View style={styles.header}>
        <AppText style={styles.name}>
          {category.icon} {category.name}
        </AppText>
        {percentage !== null ? (
          <AppText variant="caption" color={overBudget ? theme.danger : undefined}>
            {overBudget ? `${strings.summary.overBudget} · ` : ''}
            {percentage}%
          </AppText>
        ) : null}
      </View>
      {budget !== null ? <ProgressBar ratio={(percentage ?? 0) / 100} color={color} /> : null}
      <AppText variant="caption">{detail}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flexShrink: 1 },
});
