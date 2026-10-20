import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useTheme } from './theme';

type TextVariant = 'largeTitle' | 'title' | 'headline' | 'body' | 'caption';

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps & { variant?: TextVariant; color?: string }) {
  const theme = useTheme();
  const defaultColor = variant === 'caption' ? theme.textSecondary : theme.text;
  return <Text {...props} style={[textStyles[variant], { color: color ?? defaultColor }, style]} />;
}

const textStyles = StyleSheet.create({
  largeTitle: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  caption: { fontSize: 13 },
});

export function Screen({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  const theme = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      {...props}
      style={[{ flex: 1, backgroundColor: theme.background }, props.style]}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card }, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <AppText variant="caption" style={styles.sectionTitle}>
      {children}
    </AppText>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityLabel,
}: {
  title: string;
  onPress(): void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const background =
    variant === 'primary' ? theme.primary : variant === 'destructive' ? theme.danger : theme.card;
  const foreground = variant === 'secondary' ? theme.primary : theme.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <AppText variant="headline" color={foreground}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.track }]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.card }]}>
            <AppText variant="caption" color={theme.text} style={selected && styles.bold}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const theme = useTheme();
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: theme.track }]}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <AppText variant="caption" color="#FFFFFF" style={styles.bold}>
        {label}
      </AppText>
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <AppText variant="caption" style={styles.fieldLabel}>
      {children}
    </AppText>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <AppText variant="caption" color={theme.danger} style={styles.fieldError}>
      {message}
    </AppText>
  );
}

export function TextField(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[
        styles.input,
        { backgroundColor: theme.input, color: theme.text, borderColor: theme.border },
        props.style,
      ]}
    />
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange(value: boolean): void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <AppText>{label}</AppText>
        {hint ? <AppText variant="caption">{hint}</AppText> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </View>
  );
}

export function Fab({ onPress, accessibilityLabel }: { onPress(): void; accessibilityLabel: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
      ]}>
      <AppText color={theme.onPrimary} style={styles.fabIcon}>
        +
      </AppText>
    </Pressable>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },
  card: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { textTransform: 'uppercase', marginBottom: -spacing.sm, marginLeft: spacing.xs },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  segmented: { flexDirection: 'row', borderRadius: radius.sm, padding: 2 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.sm - 2 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  fieldLabel: { marginBottom: spacing.xs },
  fieldError: { marginTop: spacing.xs },
  input: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 17,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabIcon: { fontSize: 30, lineHeight: 32, fontWeight: '400' },
  divider: { height: StyleSheet.hairlineWidth },
});
