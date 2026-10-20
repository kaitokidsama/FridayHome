import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AppProvider } from '@/composition/AppProvider';
import { MonthProvider } from '@/finance/ui/MonthContext';
import { strings } from '@/shared/i18n/strings';
import { configureNotificationHandler } from '@/shared/notifications/ExpoReminderScheduler';

configureNotificationHandler();

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <AppProvider>
        <MonthProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: strings.appName }} />
            <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="invoice/[id]" options={{ title: strings.invoices.detailTitle }} />
          </Stack>
        </MonthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
