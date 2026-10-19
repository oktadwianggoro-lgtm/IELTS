"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { recordQuestionAttempt } from "@/lib/practice/record-attempt";

export type ListeningScriptTurn = { speaker: string; text: string };

export type ListeningCheckResult =
  | {
      results: Record<string, { correct: boolean; explanation: string }>;
      /** Only present in practice mode — exam mode never reveals the
       * transcript, so the same passage can still be used for timed
       * practice later without the answer having been spelled out. */
      script: ListeningScriptTurn[] | null;
    }
  | { error: string };

export async function checkListeningAnswersAction(
  passageCode: string,
  answers: Record<string, string | string[]>,
  timeSpentMs: number,
  mode: "practice" | "exam",
): Promise<ListeningCheckResult> {
  const user = await requireUser();

  const passage = await prisma.listeningPassage.findUnique({
    where: { code: passageCode },
    include: { questions: { where: { reviewStatus: "PUBLISHED" } } },
  });
  if (!passage) return { error: "Passage tidak ditemukan." };

  const results: Record<string, { correct: boolean; explanation: string }> = {};
  for (const q of passage.questions) {
    const submitted = answers[q.code];
    if (submitted === undefined) continue;
    results[q.code] = await recordQuestionAttempt(
      user.id,
      q,
      submitted,
      timeSpentMs,
      "LISTENING_PRACTICE",
    );
  }

  return {
    results,
    script: mode === "practice" ? (passage.script as ListeningScriptTurn[]) : null,
  };
}
