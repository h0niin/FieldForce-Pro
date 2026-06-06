import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).fromNow();
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('h:mm A');
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats a start and end time.
 * If they are on the same day, shows "h:mm A - h:mm A"
 * If they are on different days, shows "MMM D h:mm A - MMM D h:mm A"
 */
export function formatAppointmentTimeSpan(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start && !end) return '—';
  if (start && !end) return dayjs(start).format('MMM D, h:mm A');
  if (!start && end) return `Until ${dayjs(end).format('MMM D, h:mm A')}`;

  const dStart = dayjs(start);
  const dEnd = dayjs(end);

  if (dStart.isSame(dEnd, 'day')) {
    return `${dStart.format('h:mm A')} - ${dEnd.format('h:mm A')}`;
  } else {
    return `${dStart.format('MMM D, h:mm A')} - ${dEnd.format('MMM D, h:mm A')}`;
  }
}
