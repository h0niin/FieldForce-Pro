export const colors = {
  primary: '#1B4332',
  primaryLight: '#2D6A4F',
  primaryDark: '#081C15',
  secondary: '#52B788',
  secondaryLight: '#74C69D',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textInverse: '#FFFFFF',

  border: '#DEE2E6',
  borderLight: '#E9ECEF',
  divider: '#F1F3F5',

  success: '#2D6A4F',
  warning: '#E9A100',
  error: '#DC3545',
  info: '#0D6EFD',

  statusOpen: '#0D6EFD',
  statusInProgress: '#E9A100',
  statusOnHold: '#6C757D',
  statusCompleted: '#2D6A4F',
  statusCancelled: '#DC3545',
  statusEnRoute: '#6610F2',
  statusOnSite: '#0DCAF0',

  priorityLow: '#6C757D',
  priorityMedium: '#0D6EFD',
  priorityHigh: '#E9A100',
  priorityUrgent: '#DC3545',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
