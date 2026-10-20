import { useLocalSearchParams } from 'expo-router';

import { TransactionFormScreen } from '@/finance/ui/TransactionFormScreen';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionFormScreen id={id} />;
}
