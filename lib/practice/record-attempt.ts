import "server-only";
import { prisma } from "@/lib/db";
import { gradeAnswer } from "@/lib/content/grade-answer";
import type { AttemptSource } from "@prisma/client";

export type RecordedAttemptResult = { correct: boolean; explanation: string };

/**
 * Grades one answer, logs a `QuestionAttempt` (Master Prompt §8.4: "simpan
 * waktu menjawab, percobaan dan riwayat"), and — on a miss — upserts a Buku
 * Kesalahan entry so it surfaces for review today. Shared by every surface
 * that grades a `Question` outside its own lesson mini-quiz (Latihan
 * Harian, Listening Lab, and future labs) so this logic lives in one place.
 * Spaced-repetition state (interval/ease/repetitions) is only ever advanced
 * by the dedicated review flow in /buku-kesalahan, not by regular
 * practice/lab attempts — see docs/DECISIONS.md D-026.
 */
export async function recordQuestionAttempt(
  userId: string,
  question: {
    id: string;
    type: string;
    answerKey: unknown;
    acceptedAnswers?: unknown;
    options?: unknown;
    explanation: string;
  },
  submitted: string | string[],
  timeSpentMs: number,
  source: AttemptSource,
): Promise<RecordedAttemptResult> {
  const correct = gradeAnswer(question, submitted);

  await prisma.questionAttempt.create({
    data: {
      userId,
      questionId: question.id,
      source,
      submitted,
      correct,
      timeSpentMs: Math.max(0, Math.round(timeSpentMs)),
    },
  });

  if (!correct) {
    const now = new Date();
    await prisma.mistakeBookEntry.upsert({
      where: { userId_questionId: { userId, questionId: question.id } },
      create: {
        userId,
        questionId: question.id,
        lastSubmittedAnswer: submitted,
        nextReviewAt: now,
      },
      update: { lastSubmittedAnswer: submitted, nextReviewAt: now },
    });
  }

  return { correct, explanation: question.explanation };
}
