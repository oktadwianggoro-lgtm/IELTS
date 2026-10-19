/**
 * XP is always computed live from real activity counts, never stored as a
 * mutable running total — "XP, level, achievement dan streak boleh dipakai
 * untuk motivasi, bukan menggantikan kualitas belajar" (Master Prompt
 * §8.11). There is nothing to desync: the number always exactly reflects
 * what the counts say right now.
 */
export type XpCounts = {
  lessonsCompleted: number;
  correctPracticeAnswers: number;
  labAttemptsCompleted: number;
  tryoutAttemptsCompleted: number;
};

const XP_PER_LESSON = 10;
const XP_PER_CORRECT_ANSWER = 2;
const XP_PER_LAB_ATTEMPT = 15;
const XP_PER_TRYOUT = 20;
const XP_PER_LEVEL = 100;

export function computeXp(counts: XpCounts): number {
  return (
    counts.lessonsCompleted * XP_PER_LESSON +
    counts.correctPracticeAnswers * XP_PER_CORRECT_ANSWER +
    counts.labAttemptsCompleted * XP_PER_LAB_ATTEMPT +
    counts.tryoutAttemptsCompleted * XP_PER_TRYOUT
  );
}

export function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** Progress within the current level, for a progress bar: `current` out
 * of `needed` XP earned since the last level-up. */
export function xpIntoCurrentLevel(xp: number): { current: number; needed: number } {
  return { current: xp % XP_PER_LEVEL, needed: XP_PER_LEVEL };
}
