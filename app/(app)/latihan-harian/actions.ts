"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { recordQuestionAttempt } from "@/lib/practice/record-attempt";
import type { ErrorReason } from "@prisma/client";

export type PracticeCheckResult = { correct: boolean; explanation: string } | { error: string };

export async function checkPracticeAnswerAction(
  questionCode: string,
  submitted: string | string[],
  timeSpentMs: number,
): Promise<PracticeCheckResult> {
  const user = await requireUser();

  const question = await prisma.question.findUnique({ where: { code: questionCode } });
  if (!question) return { error: "Soal tidak ditemukan." };

  return recordQuestionAttempt(user.id, question, submitted, timeSpentMs, "ADAPTIVE_PRACTICE");
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
