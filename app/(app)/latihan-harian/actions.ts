"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { gradeAnswer } from "@/lib/content/grade-answer";
import type { ErrorReason } from "@prisma/client";

export type PracticeCheckResult = { correct: boolean; explanation: string } | { error: string };

/**
 * Grades one practice-session answer, logs it (Master Prompt §8.4: "simpan
 * waktu menjawab, percobaan dan riwayat"), and — on a miss — upserts a Buku
 * Kesalahan entry so it surfaces for review today. Spaced-repetition state
 * (interval/ease/repetitions) is only ever advanced by the dedicated review
 * flow in /buku-kesalahan, not by regular practice — see D-026.
 */
export async function checkPracticeAnswerAction(
  questionCode: string,
  submitted: string | string[],
  timeSpentMs: number,
): Promise<PracticeCheckResult> {
  const user = await requireUser();

  const question = await prisma.question.findUnique({ where: { code: questionCode } });
  if (!question) return { error: "Soal tidak ditemukan." };

  const correct = gradeAnswer(question, submitted);

  await prisma.questionAttempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      source: "ADAPTIVE_PRACTICE",
      submitted,
      correct,
      timeSpentMs: Math.max(0, Math.round(timeSpentMs)),
    },
  });

  if (!correct) {
    const now = new Date();
    await prisma.mistakeBookEntry.upsert({
      where: { userId_questionId: { userId: user.id, questionId: question.id } },
      create: {
        userId: user.id,
        questionId: question.id,
        lastSubmittedAnswer: submitted,
        nextReviewAt: now,
      },
      update: {
        lastSubmittedAnswer: submitted,
        nextReviewAt: now,
      },
    });
  }

  return { correct, explanation: question.explanation };
}

/** Lets the user tag why they missed a question (Master Prompt §8.10), from
 * either the practice results screen or the Buku Kesalahan page. */
export async function tagMistakeReasonAction(
  questionCode: string,
  reason: ErrorReason | null,
): Promise<void> {
  const user = await requireUser();
  const question = await prisma.question.findUnique({
    where: { code: questionCode },
    select: { id: true },
  });
  if (!question) return;

  await prisma.mistakeBookEntry.updateMany({
    where: { userId: user.id, questionId: question.id },
    data: { errorReason: reason },
  });

  revalidatePath("/buku-kesalahan");
}
