import "server-only";
import { prisma } from "@/lib/db";
import type { SkillArea } from "@prisma/client";
import { getUserXp } from "./data";

const ALL_SKILLS: SkillArea[] = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
  "GRAMMAR",
  "VOCABULARY",
  "PRONUNCIATION",
  "TEST_STRATEGY",
];

export type SkillProgress = {
  skill: SkillArea;
  correct: number;
  total: number;
  accuracyPct: number | null;
};

/** Per-skill accuracy straight from every graded QuestionAttempt — covers
 * Latihan Harian, Listening/Reading Lab practice, and Tryout in one query
 * since they all funnel through the same `recordQuestionAttempt()`. Skills
 * with zero attempts show `accuracyPct: null` (an honest "belum ada data"
 * empty state), never a fabricated 0%. */
export async function getSkillProgress(userId: string): Promise<SkillProgress[]> {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    select: { correct: true, question: { select: { skill: true } } },
  });

  const buckets = new Map<SkillArea, { correct: number; total: number }>();
  for (const a of attempts) {
    const bucket = buckets.get(a.question.skill) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (a.correct) bucket.correct += 1;
    buckets.set(a.question.skill, bucket);
  }

  return ALL_SKILLS.map((skill) => {
    const bucket = buckets.get(skill);
    return {
      skill,
      correct: bucket?.correct ?? 0,
      total: bucket?.total ?? 0,
      accuracyPct:
        bucket && bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : null,
    };
  });
}

export type LeaderboardEntry = { alias: string; xp: number; isCurrentUser: boolean };

/**
 * Only ever includes users who explicitly opted in
 * (`UserPreference.leaderboardOptIn`), and only ever shows their chosen
 * alias — never a real name or email (Master Prompt §8.11: "Leaderboard
 * opsional dengan nama samaran dan opt-out").
 */
export async function getLeaderboard(
  currentUserId: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const optedIn = await prisma.user.findMany({
    where: { preference: { leaderboardOptIn: true } },
    select: { id: true, preference: { select: { leaderboardAlias: true } } },
  });

  const withXp = await Promise.all(
    optedIn.map(async (u) => ({
      id: u.id,
      alias: u.preference?.leaderboardAlias?.trim() || "Anonim",
      xp: (await getUserXp(u.id)).xp,
    })),
  );

  return withXp
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((u) => ({ alias: u.alias, xp: u.xp, isCurrentUser: u.id === currentUserId }));
}
