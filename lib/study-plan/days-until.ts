const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days from `today` to `testDate`, both truncated to midnight so a
 * same-day test date returns 0 rather than a fractional/negative value from
 * time-of-day differences. Negative when the date has already passed. */
export function daysUntil(testDate: Date, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export const DEFAULT_PLAN_HORIZON_DAYS = 14;
export const MAX_PLAN_HORIZON_DAYS = 60;

/** Caps the planning horizon: no test date -> a sensible default window; a
 * far-off or past test date is clamped so the plan stays a manageable size
 * rather than scheduling months of lessons or zero lessons. */
export function resolvePlanHorizonDays(testDate: Date | null, today: Date): number {
  if (!testDate) return DEFAULT_PLAN_HORIZON_DAYS;
  const days = daysUntil(testDate, today);
  if (days <= 0) return DEFAULT_PLAN_HORIZON_DAYS;
  return Math.min(days, MAX_PLAN_HORIZON_DAYS);
}
