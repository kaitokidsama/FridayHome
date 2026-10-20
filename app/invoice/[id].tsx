import { useLocalSearchParams } from 'expo-router';

import { InvoiceDetailScreen } from '@/invoices/ui/InvoiceDetailScreen';

export default function InvoiceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <InvoiceDetailScreen id={id} />;
}
