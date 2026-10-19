import "server-only";
import { prisma } from "@/lib/db";
import { computeStreak, type StreakResult } from "./streak";
import { computeXp, computeLevel, xpIntoCurrentLevel } from "./xp";

const COMPLETED_ATTEMPT_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED"] as const;

/** Every date a user did SOMETHING that counts as "showed up to study" —
 * pulled from the real tables every lab/engine already writes to, never a
 * separate activity log that could fall out of sync. */
async function getActivityDates(userId: string): Promise<Date[]> {
  const [
    questionAttempts,
    lessonCompletions,
    writingSubmissions,
    speakingSubmissions,
    tryoutAttempts,
  ] = await Promise.all([
    prisma.questionAttempt.findMany({ where: { userId }, select: { attemptedAt: true } }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.writingSubmission.findMany({
      where: { userId, status: "SUBMITTED" },
      select: { submittedAt: true },
    }),
    prisma.speakingSubmission.findMany({
      where: { userId, status: "COMPLETED" },
      select: { completedAt: true },
    }),
    prisma.attempt.findMany({
      where: { userId, status: { in: [...COMPLETED_ATTEMPT_STATUSES] } },
      select: { submittedAt: true },
    }),
  ]);

  return [
    ...questionAttempts.map((a) => a.attemptedAt),
    ...lessonCompletions.map((l) => l.completedAt!),
    ...writingSubmissions.map((w) => w.submittedAt!),
    ...speakingSubmissions.map((s) => s.completedAt!),
    ...tryoutAttempts.map((a) => a.submittedAt!),
  ];
}

export async function getUserStreak(userId: string): Promise<StreakResult> {
  const dates = await getActivityDates(userId);
  return computeStreak(dates, new Date());
}

export async function hasActivityToday(userId: string): Promise<boolean> {
  const dates = await getActivityDates(userId);
  const todayKey = new Date().toISOString().slice(0, 10);
  return dates.some((d) => d.toISOString().slice(0, 10) === todayKey);
}

export type XpSummary = { xp: number; level: number; current: number; needed: number };

export async function getUserXp(userId: string): Promise<XpSummary> {
  // `correctPracticeAnswers` already covers every correct QuestionAttempt
  // regardless of source — including ones logged from Listening/Reading
  // Lab and from Tryout — so `labAttemptsCompleted` below only adds
  // Writing/Speaking completions (free-response tasks with no
  // corresponding QuestionAttempt rows at all) to avoid double-counting
  // the same correct answer twice under two different categories.
  const [lessonsCompleted, correctPracticeAnswers, writingCount, speakingCount, tryoutCount] =
    await Promise.all([
      prisma.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
      prisma.questionAttempt.count({ where: { userId, correct: true } }),
      prisma.writingSubmission.count({ where: { userId, status: "SUBMITTED" } }),
      prisma.speakingSubmission.count({ where: { userId, status: "COMPLETED" } }),
      prisma.attempt.count({ where: { userId, status: { in: [...COMPLETED_ATTEMPT_STATUSES] } } }),
    ]);

  const xp = computeXp({
    lessonsCompleted,
    correctPracticeAnswers,
    labAttemptsCompleted: writingCount + speakingCount,
    tryoutAttemptsCompleted: tryoutCount,
  });

  return { xp, level: computeLevel(xp), ...xpIntoCurrentLevel(xp) };
}
