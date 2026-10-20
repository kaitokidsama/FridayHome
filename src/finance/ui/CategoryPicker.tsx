import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../shared/ui/primitives';
import { radius, spacing, useTheme } from '../../shared/ui/theme';
import type { Category } from '../domain/category';

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: readonly Category[];
  value: string;
  onChange(id: string): void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={category.name}
            onPress={() => onChange(category.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.input,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}>
            <AppText variant="caption" color={selected ? theme.onPrimary : theme.text}>
              {category.icon} {category.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
