import "server-only";
import { prisma } from "@/lib/db";

export type QuestionStats = {
  attempts: number;
  correctPct: number | null;
  avgTimeSeconds: number | null;
  openReportCount: number;
};

/**
 * "Analitik mutu soal... facility/difficulty... waktu menjawab, report
 * count" (Master Prompt §11). Discrimination index is deliberately NOT
 * computed here — it requires comparing top/bottom scorer cohorts, which
 * needs real production-scale attempt volume this app doesn't have yet;
 * see docs/DECISIONS.md D-040 for why that's scoped out rather than
 * computed on too little data and presented as if meaningful.
 */
export async function getQuestionStats(questionIds: string[]): Promise<Map<string, QuestionStats>> {
  if (questionIds.length === 0) return new Map();

  const [attempts, reportCounts] = await Promise.all([
    prisma.questionAttempt.groupBy({
      by: ["questionId"],
      where: { questionId: { in: questionIds } },
      _count: { _all: true },
      _avg: { timeSpentMs: true },
    }),
    prisma.questionReport.groupBy({
      by: ["questionId"],
      where: { questionId: { in: questionIds }, status: "OPEN" },
      _count: { _all: true },
    }),
  ]);

  const correctCounts = await prisma.questionAttempt.groupBy({
    by: ["questionId"],
    where: { questionId: { in: questionIds }, correct: true },
    _count: { _all: true },
  });
  const correctByQuestion = new Map(correctCounts.map((c) => [c.questionId, c._count._all]));
  const reportsByQuestion = new Map(reportCounts.map((r) => [r.questionId, r._count._all]));

  const stats = new Map<string, QuestionStats>();
  for (const a of attempts) {
    const total = a._count._all;
    const correct = correctByQuestion.get(a.questionId) ?? 0;
    stats.set(a.questionId, {
      attempts: total,
      correctPct: total > 0 ? Math.round((correct / total) * 100) : null,
      avgTimeSeconds: a._avg.timeSpentMs != null ? Math.round(a._avg.timeSpentMs / 1000) : null,
      openReportCount: reportsByQuestion.get(a.questionId) ?? 0,
    });
  }
  // Questions with zero attempts still get an honest "no data" entry
  // rather than being silently absent from the map.
  for (const id of questionIds) {
    if (!stats.has(id)) {
      stats.set(id, {
        attempts: 0,
        correctPct: null,
        avgTimeSeconds: null,
        openReportCount: reportsByQuestion.get(id) ?? 0,
      });
    }
  }

  return stats;
}
