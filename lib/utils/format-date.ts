const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Full month name (1-indexed). */
export function monthName(month: number): string {
  return MONTH_NAMES_FULL[month - 1] || 'Unknown';
}

/** Abbreviated month name (1-indexed). */
export function shortMonthName(month: number): string {
  return MONTH_NAMES_SHORT[month - 1] || '???';
}

export function editionLabel(edition: number, month: number, year: number): string {
  return `Edition ${String(edition).padStart(2, '0')} | ${monthName(month)} ${year}`;
}

export function shortDate(month: number, year: number): string {
  return `${monthName(month)} ${year}`;
}
