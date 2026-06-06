export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  locked: 'red',
  pending: 'orange',
  completed: 'blue',
  cancelled: 'red',
  draft: 'default',
  sent: 'cyan',
  approved: 'green',
  rejected: 'red',
  expired: 'volcano',
  overdue: 'red',
  paid: 'green',
  'partially paid': 'orange',
  scheduled: 'blue',
  'in progress': 'processing',
  'on hold': 'warning',
  closed: 'default',
} as const;

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;
