import "server-only";
import { prisma } from "@/lib/db";

export type WeeklyAccuracyPoint = { week: string; accuracyPct: number; total: number };

/** ISO-week-ish bucket key (year + week number from a Monday-start week),
 * good enough for a motivational trend chart — not used for anything
 * scoring-related, so exact ISO-8601 week numbering isn't required. */
function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dayNum);
  return d.toISOString().slice(0, 10);
}

export async function getWeeklyAccuracy(userId: string, weeks = 8): Promise<WeeklyAccuracyPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);

  const attempts = await prisma.questionAttempt.findMany({
    where: { userId, attemptedAt: { gte: since } },
    select: { attemptedAt: true, correct: true },
    orderBy: { attemptedAt: "asc" },
  });

  const buckets = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const key = weekKey(a.attemptedAt);
    const bucket = buckets.get(key) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (a.correct) bucket.correct += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { correct, total }]) => ({
      week,
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
      total,
    }));
}

export type ActivityItem = {
  id: string;
  type: "lesson" | "practice" | "writing" | "speaking" | "tryout";
  label: string;
  href: string;
  at: Date;
};

/** Merges every real activity table into one chronological feed — never a
 * separate "activity log" that could fall out of sync with what actually
 * happened (same principle as streak/XP computation). */
export async function getRecentActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
  const [lessons, writing, speaking, tryouts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: { lesson: { include: { module: { include: { coursePath: true } } } } },
    }),
    prisma.writingSubmission.findMany({
      where: { userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: { writingTask: { select: { code: true, title: true } } },
    }),
    prisma.speakingSubmission.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: { speakingPrompt: { select: { code: true, title: true } } },
    }),
    prisma.attempt.findMany({
      where: { userId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: { mockTest: { select: { code: true, title: true } } },
    }),
  ]);

  const items: ActivityItem[] = [
    ...lessons.map((l) => ({
      id: `lesson-${l.id}`,
      type: "lesson" as const,
      label: `Menyelesaikan lesson "${l.lesson.title}"`,
      href: `/materi/${l.lesson.module.coursePath.code}/${l.lesson.module.code}/${l.lesson.code}`,
      at: l.completedAt!,
    })),
    ...writing.map((w) => ({
      id: `writing-${w.id}`,
      type: "writing" as const,
      label: `Submit Writing "${w.writingTask.title}"`,
      href: `/writing-lab/${w.writingTask.code}`,
      at: w.submittedAt!,
    })),
    ...speaking.map((s) => ({
      id: `speaking-${s.id}`,
      type: "speaking" as const,
      label: `Selesai Speaking "${s.speakingPrompt.title}"`,
      href: `/speaking-lab/${s.speakingPrompt.code}`,
      at: s.completedAt!,
    })),
    ...tryouts.map((a) => ({
      id: `tryout-${a.id}`,
      type: "tryout" as const,
      label: `Submit Tryout "${a.mockTest.title}"`,
      href: `/tryout/${a.mockTest.code}`,
      at: a.submittedAt!,
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export type LastTestResult =
  | { kind: "diagnostic"; level: string | null; at: Date; href: string }
  | {
      kind: "tryout";
      title: string;
      band: number | null;
      rawScore: number;
      maxRawScore: number;
      at: Date;
      href: string;
    }
  | null;

export async function getLastTestResult(userId: string): Promise<LastTestResult> {
  const [diagnostic, tryout] = await Promise.all([
    prisma.diagnosticResult.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    }),
    prisma.attempt.findFirst({
      where: { userId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { submittedAt: "desc" },
      include: { mockTest: { select: { code: true, title: true } } },
    }),
  ]);

  const diagnosticAt = diagnostic?.completedAt ?? null;
  const tryoutAt = tryout?.submittedAt ?? null;

  if (tryoutAt && (!diagnosticAt || tryoutAt > diagnosticAt)) {
    const result = tryout!.result as {
      band: number | null;
      rawScore: number;
      maxRawScore: number;
    } | null;
    return {
      kind: "tryout",
      title: tryout!.mockTest.title,
      band: result?.band ?? null,
      rawScore: result?.rawScore ?? 0,
      maxRawScore: result?.maxRawScore ?? 0,
      at: tryoutAt,
      href: `/tryout/${tryout!.mockTest.code}`,
    };
  }

  if (diagnosticAt) {
    return {
      kind: "diagnostic",
      level: diagnostic!.estimatedLevel,
      at: diagnosticAt,
      href: `/mulai-dari-sini/diagnostic/${diagnostic!.id}/hasil`,
    };
  }

  return null;
}

export async function getNextRecommendedLesson(userId: string) {
  const item = await prisma.studyPlanItem.findFirst({
    where: { studyPlan: { userId, isActive: true }, status: "PENDING" },
    orderBy: [{ scheduledDate: "asc" }, { order: "asc" }],
    include: { lesson: { include: { module: { include: { coursePath: true } } } } },
  });
  if (!item) return null;

  return {
    title: item.lesson.title,
    href: `/materi/${item.lesson.module.coursePath.code}/${item.lesson.module.code}/${item.lesson.code}`,
  };
}
