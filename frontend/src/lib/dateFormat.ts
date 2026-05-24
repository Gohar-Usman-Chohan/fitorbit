import { format, isValid } from 'date-fns';

type DateInput = string | Date | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
}

/** e.g. June 25, 2026 */
export function formatDate(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return format(date, 'MMMM d, yyyy');
}

/** e.g. 2:30 PM */
export function formatTime(value: DateInput, fallback = ''): string {
  const date = toDate(value);
  if (!date) return fallback;
  return format(date, 'h:mm a');
}

/** e.g. June 25, 2026 at 2:30 PM */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return format(date, "MMMM d, yyyy 'at' h:mm a");
}

/** e.g. Mon */
export function formatWeekdayShort(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return format(date, 'EEE');
}

/** Chart axis labels with date and time */
export function formatChartDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '';
  return format(date, 'MMMM d, yyyy h:mm a');
}
