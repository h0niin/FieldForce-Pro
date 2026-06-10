export function formatMinutesToReadableTime(totalMinutes: number | undefined | null): string {
  if (totalMinutes === undefined || totalMinutes === null) return '-';
  if (totalMinutes === 0) return '-';

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  if (totalMinutes === 60) {
    return `1 hr`;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutesAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }

  return parts.join(' ');
}
