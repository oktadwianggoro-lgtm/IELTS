import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/gamification/streak";

const d = (iso: string) => new Date(iso);

describe("computeStreak", () => {
  it("returns zero for no activity at all", () => {
    expect(computeStreak([], d("2026-01-10"))).toEqual({
      currentStreakDays: 0,
      longestStreakDays: 0,
    });
  });

  it("counts a single day of activity today as a streak of 1", () => {
    const result = computeStreak([d("2026-01-10T08:00:00Z")], d("2026-01-10T20:00:00Z"));
    expect(result).toEqual({ currentStreakDays: 1, longestStreakDays: 1 });
  });

  it("counts consecutive days ending today", () => {
    const dates = [d("2026-01-08"), d("2026-01-09"), d("2026-01-10")];
    expect(computeStreak(dates, d("2026-01-10T12:00:00Z"))).toEqual({
      currentStreakDays: 3,
      longestStreakDays: 3,
    });
  });

  it("keeps the streak alive if the last activity was yesterday (not yet broken)", () => {
    const dates = [d("2026-01-08"), d("2026-01-09")];
    expect(computeStreak(dates, d("2026-01-10T12:00:00Z"))).toEqual({
      currentStreakDays: 2,
      longestStreakDays: 2,
    });
  });

  it("resets the current streak to 0 once a full day has been missed", () => {
    const dates = [d("2026-01-05"), d("2026-01-06")];
    expect(computeStreak(dates, d("2026-01-10T12:00:00Z"))).toEqual({
      currentStreakDays: 0,
      longestStreakDays: 2,
    });
  });

  it("tracks the longest streak separately from the current one", () => {
    // A 5-day run early on, then a gap, then a fresh 2-day run up to today.
    const dates = [
      d("2026-01-01"),
      d("2026-01-02"),
      d("2026-01-03"),
      d("2026-01-04"),
      d("2026-01-05"),
      d("2026-01-09"),
      d("2026-01-10"),
    ];
    expect(computeStreak(dates, d("2026-01-10T12:00:00Z"))).toEqual({
      currentStreakDays: 2,
      longestStreakDays: 5,
    });
  });

  it("deduplicates multiple activities on the same day", () => {
    const dates = [d("2026-01-10T01:00:00Z"), d("2026-01-10T02:00:00Z"), d("2026-01-10T23:00:00Z")];
    expect(computeStreak(dates, d("2026-01-10T23:30:00Z"))).toEqual({
      currentStreakDays: 1,
      longestStreakDays: 1,
    });
  });
});
