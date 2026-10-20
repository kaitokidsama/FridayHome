import { useColorScheme } from 'react-native';

const light = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6C6C70',
  border: '#D1D1D6',
  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  track: '#E5E5EA',
  input: '#FFFFFF',
};

export type Palette = typeof light;

const dark: Palette = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  primary: '#0A84FF',
  onPrimary: '#FFFFFF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  track: '#3A3A3C',
  input: '#2C2C2E',
};

export const palettes = { light, dark };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
