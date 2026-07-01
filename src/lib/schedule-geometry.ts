// Pure day↔pixel geometry for the schedule grid. All dates are 'YYYY-MM-DD'
// strings handled in UTC so there is no timezone drift. xFromDate and dateFromX
// are exact inverses on whole days; dateFromX snaps to the nearest day.

const MS_DAY = 86_400_000;

export function utcMs(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

export function toDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from a → b (b − a). Negative if b precedes a. */
export function daysBetween(a: string, b: string): number {
  return Math.round((utcMs(b) - utcMs(a)) / MS_DAY);
}

export function addDays(d: string, n: number): string {
  return toDateStr(utcMs(d) + n * MS_DAY);
}

export function monthStart(d: string): string {
  const [y, m] = d.split('-').map(Number);
  return toDateStr(Date.UTC(y, m - 1, 1));
}

export function monthEnd(d: string): string {
  const [y, m] = d.split('-').map(Number);
  return toDateStr(Date.UTC(y, m, 0)); // day 0 of next month = last day of this one
}

/** Inclusive duration: a bar from d..d is 1 day. */
export function durationDays(start: string, end: string): number {
  return daysBetween(start, end) + 1;
}

export function xFromDate(d: string, origin: string, dayW: number): number {
  return daysBetween(origin, d) * dayW;
}

/** Pixel offset (from the track's left edge) → snapped date string. */
export function dateFromX(px: number, origin: string, dayW: number): string {
  return addDays(origin, Math.round(px / dayW));
}

/** List of {label, start} for each month spanned by [origin, end]. */
export function monthsBetween(origin: string, end: string): { label: string; start: string }[] {
  const out: { label: string; start: string }[] = [];
  let cur = monthStart(origin);
  const endMs = utcMs(end);
  while (utcMs(cur) <= endMs) {
    const dt = new Date(utcMs(cur));
    out.push({ label: dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }), start: cur });
    const [y, m] = cur.split('-').map(Number);
    cur = toDateStr(Date.UTC(y, m, 1)); // first of next month
  }
  return out;
}
