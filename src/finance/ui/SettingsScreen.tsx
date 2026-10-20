import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useApp } from '../../composition/AppContext';
import { strings } from '../../shared/i18n/strings';
import { isValidCurrencyCode, parseAmountToMinorUnits, toMajorUnitsString } from '../../shared/money/money';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermission,
} from '../../shared/notifications/ExpoReminderScheduler';
import {
  AppText,
  Button,
  Card,
  Divider,
  FieldError,
  Screen,
  SectionTitle,
  TextField,
} from '../../shared/ui/primitives';
import { ErrorState, LoadingState } from '../../shared/ui/states';
import { spacing, useTheme } from '../../shared/ui/theme';
import { useFocusedQuery } from '../../shared/ui/useFocusedQuery';
import type { Category } from '../domain/category';
import { useMoney } from './useMoney';

export function SettingsScreen() {
  const { services } = useApp();
  const loader = useCallback(() => services.finance.listCategories('expense'), [services]);
  const { data: categories, error, reload } = useFocusedQuery(loader);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!categories) return <LoadingState />;

  return (
    <Screen>
      <SectionTitle>{strings.settings.currency}</SectionTitle>
      <CurrencyEditor />

      <SectionTitle>{strings.settings.budgets}</SectionTitle>
      <Card>
        <AppText variant="caption">{strings.settings.budgetsHint}</AppText>
        {categories.map((category, index) => (
          <View key={category.id}>
            {index > 0 ? <Divider /> : null}
            <BudgetEditorRow category={category} onSaved={reload} />
          </View>
        ))}
      </Card>

      <SectionTitle>{strings.settings.notifications}</SectionTitle>
      <NotificationsCard />

      <AppText variant="caption" style={styles.about}>
        {strings.settings.about}
      </AppText>
    </Screen>
  );
}

function CurrencyEditor() {
  const { currency, updateCurrency } = useApp();
  const [code, setCode] = useState(currency);
  const [invalid, setInvalid] = useState(false);
  const normalized = code.trim().toUpperCase();

  useEffect(() => setCode(currency), [currency]);

  const save = async () => {
    if (!isValidCurrencyCode(normalized)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    await updateCurrency(normalized);
  };

  return (
    <Card>
      <View style={styles.inline}>
        <TextField
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={3}
          accessibilityLabel={strings.settings.currency}
          style={styles.flex}
          onSubmitEditing={save}
        />
        <Button title={strings.common.save} onPress={save} disabled={normalized === currency} />
      </View>
      <AppText variant="caption">{strings.settings.currencyHint}</AppText>
      <FieldError message={invalid ? strings.settings.currencyInvalid : null} />
    </Card>
  );
}

function BudgetEditorRow({ category, onSaved }: { category: Category; onSaved(): void }) {
  const { services } = useApp();
  const money = useMoney();
  const initial =
    category.monthlyBudget === null ? '' : toMajorUnitsString(category.monthlyBudget, money.fractionDigits);
  const [text, setText] = useState(initial);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => setText(initial), [initial]);

  const commit = async () => {
    const trimmed = text.trim();
    const budget = trimmed === '' ? null : parseAmountToMinorUnits(trimmed, money.fractionDigits);
    if (trimmed !== '' && budget === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (budget === category.monthlyBudget) return;
    await services.finance.setCategoryBudget(category.id, budget);
    onSaved();
  };

  return (
    <View style={styles.budgetRow}>
      <View style={styles.inline}>
        <AppText style={styles.flex}>
          {category.icon} {category.name}
        </AppText>
        <TextField
          value={text}
          onChangeText={setText}
          onEndEditing={commit}
          placeholder={strings.settings.budgetPlaceholder}
          keyboardType={money.fractionDigits === 0 ? 'number-pad' : 'decimal-pad'}
          accessibilityLabel={`${strings.settings.budgets}: ${category.name}`}
          style={styles.budgetInput}
          textAlign="right"
        />
      </View>
      <FieldError message={invalid ? strings.settings.budgetInvalid : null} />
    </View>
  );
}

function NotificationsCard() {
  const theme = useTheme();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    getNotificationPermission().then(setPermission).catch(() => setPermission('undetermined'));
  }, []);

  return (
    <Card>
      <AppText variant="caption">{strings.settings.notificationsHint}</AppText>
      {permission === 'granted' ? (
        <AppText color={theme.success}>{strings.settings.notificationsGranted}</AppText>
      ) : permission === 'denied' ? (
        <AppText color={theme.danger}>{strings.settings.notificationsDenied}</AppText>
      ) : (
        <Button
          title={strings.settings.enableNotifications}
          onPress={async () => setPermission(await requestNotificationPermission())}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  budgetRow: { paddingVertical: spacing.sm },
  budgetInput: { width: 130 },
  about: { textAlign: 'center' },
});
