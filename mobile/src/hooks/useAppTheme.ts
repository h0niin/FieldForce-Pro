import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/theme.store';
import { colors as lightColors } from '@/theme';

const darkColors = {
  ...lightColors,

  background: '#0F1117',
  surface: '#1A1D27',
  card: '#1A1D27',

  text: '#F0F1F3',
  textSecondary: '#9CA3AF',
  textLight: '#6B7280',
  textInverse: '#FFFFFF',

  border: '#2D3140',
  borderLight: '#252836',
  divider: '#1F2230',

  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export type AppColors = typeof lightColors;

export interface AppTheme {
  colors: AppColors;
  isDark: boolean;
  // Common hardcoded colors replaced
  cardBg: string;
  headerBg: string;
  inputBg: string;
  borderColor: string;
}

export function useAppTheme(): AppTheme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const colors: AppColors = isDark ? darkColors : lightColors;

  return {
    colors,
    isDark,
    cardBg: isDark ? '#1A1D27' : '#FFFFFF',
    headerBg: isDark ? '#1A1D27' : '#FFFFFF',
    inputBg: isDark ? '#252836' : '#F8F9FB',
    borderColor: isDark ? '#2D3140' : '#E2E8F0',
  };
}
