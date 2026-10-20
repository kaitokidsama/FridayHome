import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { strings } from '../i18n/strings';
import { AppText, Button } from './primitives';
import { spacing, useTheme } from './theme';

export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator accessibilityLabel={strings.common.loading} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <AppText variant="headline">{strings.common.error}</AppText>
      {message ? <AppText variant="caption">{message}</AppText> : null}
      {onRetry ? <Button title={strings.common.retry} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <AppText variant="caption" style={styles.centerText}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  centerText: { textAlign: 'center' },
});
