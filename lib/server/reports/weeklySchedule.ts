/**
 * Scheduling math for the weekly report. Pure functions, no DB. All time
 * computation respects the owner's IANA timezone via Intl.DateTimeFormat
 * (zero new deps).
 */

export type ScheduleInput = {
  /** Current UTC instant. */
  nowMs: number;
  /** Owner's IANA timezone, e.g. "America/New_York". */
  timezone: string;
  /** Day-of-week to deliver (0=Sun..6=Sat). */
  dow: number;
  /** Local hour-of-day to deliver (0-23). */
  hour: number;
};

type LocalParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  weekday: number; // 0=Sun..6=Sat
};

/**
 * Convert a UTC instant into the local wall-clock components for a given
 * timezone. We format then parse — robust to DST changes without an
 * external library.
 */
export function localParts(nowMs: number, timezone: string): LocalParts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = f.formatToParts(new Date(nowMs));
  const lookup: Record<string, string> = {};
  for (const p of parts) lookup[p.type] = p.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const hour = Number(lookup.hour);
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    // Intl returns "24" instead of "00" in some locales at midnight.
    hour: hour === 24 ? 0 : hour,
    weekday: weekdayMap[lookup.weekday] ?? 0,
  };
}

/**
 * Is `nowMs` inside the owner's scheduled hour window? The cron runs
 * hourly, so we accept the matching hour (HH:00 through HH:59). Returns
 * true exactly once per week per owner.
 */
export function isInDeliveryWindow(input: ScheduleInput): boolean {
  const lp = localParts(input.nowMs, input.timezone);
  return lp.weekday === input.dow && lp.hour === input.hour;
}

/**
 * Stable week key for idempotency — uses the owner's local week to group
 * sends. Format: "YYYY-Www" where Www is an ISO-ish week-of-year derived
 * from the local date so two cron runs in the same week produce the same
 * key even across midnight.
 */
export function weekKey(nowMs: number, timezone: string): string {
  const lp = localParts(nowMs, timezone);
  // Compute ISO week number from the local date. Use UTC date math on the
  // local Y-M-D so DST doesn't shift the week.
  const d = new Date(Date.UTC(lp.year, lp.month - 1, lp.day));
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Window covering the trailing 7 days in the owner's timezone. Used for
 * the "this week" totals on the report. Endpoint is now; start is exactly
 * 7 days earlier.
 */
export function weeklyWindow(nowMs: number): { fromMs: number; toMs: number } {
  return { fromMs: nowMs - 7 * 86_400_000, toMs: nowMs };
}

export function weekRangeLabel(nowMs: number, timezone: string): string {
  const end = new Date(nowMs);
  const start = new Date(nowMs - 6 * 86_400_000);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}
