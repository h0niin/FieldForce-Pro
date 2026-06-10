import type { ServiceAppointmentStatus } from '@/types/models.types';

/**
 * Status badge colours. The spec lists New/Scheduled/In Progress/Completed/
 * Cancelled; the backend keeps the richer 7-state flow (en_route, on_site,
 * on_hold) used by mobile/dispatch, so we colour those too.
 */
export const appointmentStatusColors: Record<string, string> = {
  new: 'blue',
  scheduled: 'purple',
  en_route: 'geekblue',
  on_site: 'cyan',
  in_progress: 'orange',
  on_hold: 'gold',
  completed: 'green',
  cancelled: 'default',
};

export const billingStatusColors: Record<string, string> = {
  not_invoiced: 'default',
  invoiced: 'green',
};

export function formatStatusLabel(status: string): string {
  return (status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatBillingStatus(status?: string | null): string {
  if (!status) return 'Not Invoiced';
  return formatStatusLabel(status);
}

/** Valid next statuses surfaced as contextual buttons on the detail page. */
export const appointmentStatusTransitions: Record<string, ServiceAppointmentStatus[]> = {
  scheduled: ['en_route', 'in_progress', 'cancelled'],
  en_route: ['on_site', 'in_progress', 'cancelled'],
  on_site: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a seconds duration as HH:mm. */
export function formatDurationHm(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

/** Format a seconds duration as HH:mm:ss. */
export function formatDurationHms(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '--:--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
