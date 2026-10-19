import "server-only";
import { prisma } from "@/lib/db";
import { ACHIEVEMENT_CATALOG, type AchievementCode } from "./catalog";

export { ACHIEVEMENT_CATALOG, type AchievementCode };

/**
 * Every criterion here is evaluated against real activity tables — never
 * a generic stored rule — so each award stays auditable in code review.
 * Seeded into the `Achievement` catalog table by `prisma/seed.ts` (upsert
 * by code, never delete+recreate, since `UserAchievement` rows must
 * survive re-seeding).
 */

/**
 * Checks every criterion and upserts a `UserAchievement` row for any newly
 * qualifying one — safe to call on every dashboard visit since the upsert
 * is a no-op once already earned (never re-awards, never revokes).
 */
export async function evaluateAndAwardAchievements(
  userId: string,
  context: { onboardingCompleted: boolean; longestStreakDays: number },
): Promise<void> {
  const [diagnosticCount, questionAttemptCount, writingCount, speakingCount, tryoutCount] =
    await Promise.all([
      prisma.diagnosticResult.count({ where: { userId, status: "COMPLETED" } }),
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.writingSubmission.count({ where: { userId, status: "SUBMITTED" } }),
      prisma.speakingSubmission.count({ where: { userId, status: "COMPLETED" } }),
      prisma.attempt.count({ where: { userId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } }),
    ]);

  const qualifies: Record<AchievementCode, boolean> = {
    ONBOARDING_DONE: context.onboardingCompleted,
    FIRST_DIAGNOSTIC: diagnosticCount > 0,
    STREAK_7: context.longestStreakDays >= 7,
    HUNDRED_QUESTIONS: questionAttemptCount >= 100,
    FIRST_WRITING: writingCount > 0,
    FIRST_SPEAKING: speakingCount > 0,
    FIRST_TRYOUT: tryoutCount > 0,
  };

  const codesToAward = Object.entries(qualifies)
    .filter(([, qualified]) => qualified)
    .map(([code]) => code as AchievementCode);
  if (codesToAward.length === 0) return;

  const achievements = await prisma.achievement.findMany({ where: { code: { in: codesToAward } } });
  for (const achievement of achievements) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id },
      update: {},
    });
  }
}

export async function getUserAchievements(userId: string) {
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { earnedAt: "asc" },
  });
  const earnedCodes = new Set(earned.map((e) => e.achievement.code));

  return ACHIEVEMENT_CATALOG.map((a) => ({
    ...a,
    earned: earnedCodes.has(a.code),
    earnedAt: earned.find((e) => e.achievement.code === a.code)?.earnedAt ?? null,
  }));
}
