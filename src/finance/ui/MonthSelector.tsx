import { Pressable, StyleSheet, View } from 'react-native';

import { formatMonthLabel } from '../../shared/dates/format';
import { strings } from '../../shared/i18n/strings';
import { AppText } from '../../shared/ui/primitives';
import { spacing, useTheme } from '../../shared/ui/theme';
import { useSelectedMonth } from './MonthContext';

export function MonthSelector({ locale }: { locale: string }) {
  const theme = useTheme();
  const { month, shift } = useSelectedMonth();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.month.previous}
        hitSlop={12}
        onPress={() => shift(-1)}>
        <AppText variant="title" color={theme.primary}>
          ‹
        </AppText>
      </Pressable>
      <AppText variant="headline" style={styles.label}>
        {formatMonthLabel(month, locale)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.month.next}
        hitSlop={12}
        onPress={() => shift(1)}>
        <AppText variant="title" color={theme.primary}>
          ›
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  label: { textTransform: 'capitalize' },
});
