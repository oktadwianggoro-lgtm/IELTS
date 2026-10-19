import { describe, expect, it } from "vitest";
import { computeXp, computeLevel, xpIntoCurrentLevel } from "@/lib/gamification/xp";

describe("computeXp", () => {
  it("returns 0 for a brand new user with no activity", () => {
    expect(
      computeXp({
        lessonsCompleted: 0,
        correctPracticeAnswers: 0,
        labAttemptsCompleted: 0,
        tryoutAttemptsCompleted: 0,
      }),
    ).toBe(0);
  });

  it("weights each activity type independently and sums them", () => {
    const xp = computeXp({
      lessonsCompleted: 2, // 2 * 10 = 20
      correctPracticeAnswers: 10, // 10 * 2 = 20
      labAttemptsCompleted: 1, // 1 * 15 = 15
      tryoutAttemptsCompleted: 1, // 1 * 20 = 20
    });
    expect(xp).toBe(75);
  });
});

describe("computeLevel", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("stays at level 1 until 100 XP", () => {
    expect(computeLevel(99)).toBe(1);
  });

  it("reaches level 2 at exactly 100 XP", () => {
    expect(computeLevel(100)).toBe(2);
  });

  it("reaches level 3 at 200 XP", () => {
    expect(computeLevel(200)).toBe(3);
  });
});

describe("xpIntoCurrentLevel", () => {
  it("reports progress within the current level", () => {
    expect(xpIntoCurrentLevel(150)).toEqual({ current: 50, needed: 100 });
  });

  it("reports 0 progress right at a level boundary", () => {
    expect(xpIntoCurrentLevel(200)).toEqual({ current: 0, needed: 100 });
  });
});
