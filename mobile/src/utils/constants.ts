export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const STATUS_COLORS: Record<string, string> = {
  // Work order statuses (server values)
  new: '#0D6EFD',
  estimated: '#6610F2',
  approved: '#0DCAF0',
  scheduled: '#0D6EFD',
  in_progress: '#E9A100',
  on_hold: '#6C757D',
  completed: '#2D6A4F',
  closed: '#343A40',
  cancelled: '#DC3545',
  // Legacy
  open: '#0D6EFD',
  not_started: '#6C757D',
  // Timesheet statuses (server values: pending / approved / rejected)
  pending: '#E9A100',
  rejected: '#DC3545',
  // 'approved' is already defined above (reused colour from work-order status)
};

// Human-readable labels for each server status
export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  estimated: 'Estimated',
  approved: 'Approved',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

/**
 * Client-side mirror of the server's STATUS_TRANSITIONS state machine.
 * Each key is a current status; the value is the array of valid next statuses
 * a field technician can transition to.
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['estimated', 'approved', 'scheduled', 'cancelled'],
  estimated: ['approved', 'cancelled'],
  approved: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6C757D',
  medium: '#0D6EFD',
  high: '#E9A100',
  urgent: '#DC3545',
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  take: 20,
};
