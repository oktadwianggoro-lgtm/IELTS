"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { recordQuestionAttempt } from "@/lib/practice/record-attempt";

export type ReadingQuestionResult = {
  correct: boolean;
  explanation: string;
  evidence: string | null;
};

export type ReadingCheckResult =
  { results: Record<string, ReadingQuestionResult> } | { error: string };

/**
 * Unlike the Listening Lab, Reading has no separate practice/exam mode —
 * the passage text is already fully visible on screen the whole time (the
 * thing Listening's exam mode protects is the one-time audio, which has no
 * Reading equivalent), so evidence/explanation are always returned here
 * once checked. See docs/DECISIONS.md D-034.
 */
export async function checkReadingAnswersAction(
  passageCode: string,
  answers: Record<string, string | string[]>,
  timeSpentMs: number,
): Promise<ReadingCheckResult> {
  const user = await requireUser();

  const passage = await prisma.readingPassage.findUnique({
    where: { code: passageCode },
    include: { questions: { where: { reviewStatus: "PUBLISHED" } } },
  });
  if (!passage) return { error: "Passage tidak ditemukan." };

  const results: Record<string, ReadingQuestionResult> = {};
  for (const q of passage.questions) {
    const submitted = answers[q.code];
    if (submitted === undefined) continue;
    const graded = await recordQuestionAttempt(
      user.id,
      q,
      submitted,
      timeSpentMs,
      "READING_PRACTICE",
    );
    results[q.code] = { ...graded, evidence: q.evidence };
  }

  return { results };
}
