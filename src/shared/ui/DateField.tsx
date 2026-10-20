import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatDisplayDate } from '../dates/format';
import { fromIsoDate, toIsoDate, type IsoDate } from '../dates/isoDate';
import { AppText } from './primitives';
import { radius, spacing, useTheme } from './theme';

/** Native date input: compact picker on iOS, dialog on Android. */
export function DateField({
  value,
  onChange,
  locale,
  accessibilityLabel,
}: {
  value: IsoDate;
  onChange(value: IsoDate): void;
  locale: string;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const [androidOpen, setAndroidOpen] = useState(false);
  const date = fromIsoDate(value);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          locale={locale}
          accessibilityLabel={accessibilityLabel}
          onValueChange={(_event, selected) => onChange(toIsoDate(selected))}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setAndroidOpen(true)}
        style={[styles.androidButton, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <AppText>{formatDisplayDate(value, locale)}</AppText>
      </Pressable>
      {androidOpen ? (
        <DateTimePicker
          value={date}
          mode="date"
          onValueChange={(_event, selected) => {
            setAndroidOpen(false);
            onChange(toIsoDate(selected));
          }}
          onDismiss={() => setAndroidOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  iosRow: { flexDirection: 'row' },
  androidButton: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});
