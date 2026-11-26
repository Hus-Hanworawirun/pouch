/**
 * Date/time utilities for converting SQLite UTC timestamps into local wall-clock time.
 */

/**
 * Parses a SQLite CURRENT_TIMESTAMP ('YYYY-MM-DD HH:MM:SS' in UTC),
 * a date-only string ('YYYY-MM-DD' in local calendar), or an ISO timestamp into a Date.
 */
export function parseUtcDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const str = String(value).trim();

  // SQLite CURRENT_TIMESTAMP has no timezone suffix and represents UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return new Date(`${str.replace(' ', 'T')}Z`);
  }

  // Date-only strings (e.g., expense_date) represent a local calendar date
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  return new Date(str);
}

/**
 * Formats a Date or SQLite timestamp into local 'YYYY-MM-DD' calendar key.
 */
export function toLocalDateKey(value = new Date()) {
  const d = value instanceof Date ? value : parseUtcDate(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
