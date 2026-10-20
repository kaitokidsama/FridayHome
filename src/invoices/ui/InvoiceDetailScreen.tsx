import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useServices } from '../../composition/AppContext';
import { formatDisplayDate, formatTimestampDate } from '../../shared/dates/format';
import { strings } from '../../shared/i18n/strings';
import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  FieldLabel,
  Screen,
  SectionTitle,
  TextField,
} from '../../shared/ui/primitives';
import { ErrorState, LoadingState } from '../../shared/ui/states';
import { radius, spacing, useTheme } from '../../shared/ui/theme';
import { useFocusedQuery } from '../../shared/ui/useFocusedQuery';
import { useMoney } from '../../finance/ui/useMoney';
import {
  isImageUri,
  pickDocument,
  pickFromLibrary,
  takePhoto,
  type PickedAttachment,
} from './pickAttachment';

export function InvoiceDetailScreen({ id }: { id: string }) {
  const services = useServices();
  const theme = useTheme();
  const money = useMoney();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const loader = useCallback(() => services.invoices.get(id), [services, id]);
  const { data: invoice, error, loading, reload } = useFocusedQuery(loader);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading && !invoice) return <LoadingState />;
  if (!invoice) return <ErrorState message={strings.invoices.notFound} />;

  const receive = async (pick: (() => Promise<PickedAttachment | null>) | null) => {
    setBusy(true);
    try {
      const attachment = pick ? await pick() : null;
      if (pick && !attachment) return;
      await services.invoices.receive({
        invoiceId: invoice.id,
        attachment: attachment ? { uri: attachment.uri, name: attachment.name } : null,
        notes: notes.trim() || invoice.notes,
      });
      reload();
    } catch (caught) {
      Alert.alert(strings.common.error, caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const isPending = invoice.status === 'pending';

  return (
    <>
      <Stack.Screen options={{ title: invoice.description || strings.invoices.detailTitle }} />
      <Screen>
        <Card>
          <View style={styles.inline}>
            <AppText variant="title" style={styles.flex}>
              {money.format(invoice.amount)}
            </AppText>
            <Badge
              label={
                invoice.overdue
                  ? strings.invoices.overdue
                  : isPending
                    ? strings.invoices.pending
                    : strings.invoices.received
              }
              color={invoice.overdue ? theme.danger : isPending ? theme.warning : theme.success}
            />
          </View>
          <Divider />
          <DetailRow
            label={strings.invoices.expenseDate}
            value={formatDisplayDate(invoice.transactionDate, money.locale)}
          />
          {isPending ? (
            <DetailRow
              label={strings.transactions.expectedDate}
              value={
                invoice.expectedDate
                  ? formatDisplayDate(invoice.expectedDate, money.locale)
                  : strings.invoices.noExpectedDate
              }
            />
          ) : invoice.receivedAt ? (
            <DetailRow
              label={strings.invoices.received}
              value={formatTimestampDate(invoice.receivedAt, money.locale)}
            />
          ) : null}
          {invoice.notes ? <DetailRow label={strings.invoices.notes} value={invoice.notes} /> : null}
        </Card>

        {isPending ? (
          <>
            <SectionTitle>{strings.invoices.markReceived}</SectionTitle>
            <Card>
              <FieldLabel>{strings.invoices.notes}</FieldLabel>
              <TextField
                value={notes}
                onChangeText={setNotes}
                placeholder={strings.invoices.notesPlaceholder}
                accessibilityLabel={strings.invoices.notes}
                multiline
              />
              <View style={styles.actions}>
                <Button title={strings.invoices.takePhoto} onPress={() => receive(takePhoto)} disabled={busy} />
                <Button
                  title={strings.invoices.chooseFromLibrary}
                  onPress={() => receive(pickFromLibrary)}
                  disabled={busy}
                />
                <Button
                  title={strings.invoices.chooseFile}
                  onPress={() => receive(pickDocument)}
                  variant="secondary"
                  disabled={busy}
                />
                <Button
                  title={strings.invoices.withoutAttachment}
                  onPress={() => receive(null)}
                  variant="secondary"
                  disabled={busy}
                />
              </View>
            </Card>
          </>
        ) : (
          <>
            <SectionTitle>{strings.invoices.attachment}</SectionTitle>
            <Card>
              {invoice.attachmentUri && isImageUri(invoice.attachmentUri) ? (
                <Image
                  source={{ uri: invoice.attachmentUri }}
                  style={[styles.preview, { backgroundColor: theme.track }]}
                  contentFit="contain"
                  accessibilityLabel={strings.invoices.attachment}
                />
              ) : invoice.attachmentUri ? (
                <AppText>📄 {strings.invoices.openFile}</AppText>
              ) : (
                <AppText variant="caption">{strings.invoices.noAttachment}</AppText>
              )}
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.inline}>
      <AppText variant="caption" style={styles.flex}>
        {label}
      </AppText>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  value: { flexShrink: 1, textAlign: 'right' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.sm },
});
