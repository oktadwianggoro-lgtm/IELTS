const MS_PER_DAY = 86_400_000;

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type StreakResult = { currentStreakDays: number; longestStreakDays: number };

/**
 * Pure, deterministic streak computation from a plain list of activity
 * timestamps — "not manipulative" (Master Prompt §8.3/§8.11) means it's
 * always derived live from real activity, never a mutable counter that
 * could drift from what the user actually did. Dates are compared in UTC
 * day boundaries for determinism; `today` is passed in rather than read
 * internally so this stays pure and trivially testable.
 */
export function computeStreak(activityDates: Date[], today: Date): StreakResult {
  const days = new Set(activityDates.map(toDateKey));
  if (days.size === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  const sorted = [...days].sort();

  let longestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`).getTime();
    const curr = new Date(`${sorted[i]}T00:00:00Z`).getTime();
    run = Math.round((curr - prev) / MS_PER_DAY) === 1 ? run + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, run);
  }

  const todayKey = toDateKey(today);
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  const yesterdayKey = toDateKey(yesterday);

  // A streak is still "alive" (not yet broken) if the most recent activity
  // was today or yesterday — the user hasn't missed a full day yet.
  let anchor: Date | null = null;
  if (days.has(todayKey)) anchor = today;
  else if (days.has(yesterdayKey)) anchor = yesterday;

  let currentStreakDays = 0;
  if (anchor) {
    currentStreakDays = 1;
    let cursor = anchor;
    for (;;) {
      cursor = new Date(cursor.getTime() - MS_PER_DAY);
      if (!days.has(toDateKey(cursor))) break;
      currentStreakDays += 1;
    }
  }

  return { currentStreakDays, longestStreakDays };
}
