import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';

import { strings } from '@/shared/i18n/strings';
import { useTheme } from '@/shared/ui/theme';

function tabIcon(name: SFSymbol, fallback: string) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return (
      <SymbolView
        name={name}
        tintColor={color}
        size={size}
        fallback={<Text style={{ color, fontSize: size * 0.8 }}>{fallback}</Text>}
      />
    );
  };
}

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: strings.tabs.summary, tabBarIcon: tabIcon('chart.pie.fill', '◔') }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: strings.tabs.transactions, tabBarIcon: tabIcon('list.bullet', '☰') }}
      />
      <Tabs.Screen
        name="invoices"
        options={{ title: strings.tabs.invoices, tabBarIcon: tabIcon('doc.text.fill', '🧾') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: strings.tabs.settings, tabBarIcon: tabIcon('gearshape.fill', '⚙') }}
      />
    </Tabs>
  );
}
