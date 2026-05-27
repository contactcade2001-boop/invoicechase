import "server-only";

/**
 * Days from "last furnishing" (last day of labor or materials supplied) to
 * file a mechanics lien claim, per US state.
 *
 * IMPORTANT: this is general-information guidance, not legal advice. Many
 * states have additional pre-claim notice requirements (e.g. preliminary
 * notice within 20 days of starting work). Owners should consult a
 * construction attorney before filing. The reminder is intended to flag
 * deadlines, not to file on behalf of the user.
 */
export const LIEN_DEADLINE_DAYS: Record<string, number> = {
  AL: 180,
  AK: 120,
  AZ: 120,
  AR: 120,
  CA: 90,
  CO: 120,
  CT: 90,
  DE: 180,
  FL: 90,
  GA: 90,
  HI: 45,
  ID: 90,
  IL: 120,
  IN: 90,
  IA: 90,
  KS: 120,
  KY: 180,
  LA: 60,
  ME: 90,
  MD: 180,
  MA: 90,
  MI: 90,
  MN: 120,
  MS: 90,
  MO: 180,
  MT: 90,
  NE: 120,
  NV: 90,
  NH: 120,
  NJ: 90,
  NM: 120,
  NY: 240,
  NC: 120,
  ND: 90,
  OH: 75,
  OK: 90,
  OR: 75,
  PA: 180,
  RI: 200,
  SC: 90,
  SD: 120,
  TN: 90,
  TX: 120,
  UT: 90,
  VT: 180,
  VA: 90,
  WA: 90,
  WV: 100,
  WI: 180,
  WY: 120,
  DC: 90,
};

export function computeLienDeadline(
  state: string,
  lastFurnishDateMs: number,
): number | null {
  const days = LIEN_DEADLINE_DAYS[state.toUpperCase()];
  if (!days) return null;
  return lastFurnishDateMs + days * 86_400_000;
}

export function lienUrgency(filingDeadlineMs: number): "expired" | "critical" | "warning" | "fresh" {
  const remaining = filingDeadlineMs - Date.now();
  const daysLeft = Math.floor(remaining / 86_400_000);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 14) return "critical";
  if (daysLeft <= 45) return "warning";
  return "fresh";
}
