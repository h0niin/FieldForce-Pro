/**
 * Formats a raw database enum (UPPERCASE_SNAKE) into a formal Title Case string.
 * Example: 'NEEDS_REPAIR' -> 'Needs Repair'
 */
export function formatEnumText(val: string | undefined | null): string {
  if (!val) return '';
  if (typeof val === 'string' && /^[A-Z0-9_]+$/.test(val)) {
    return val
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
  return String(val);
}
