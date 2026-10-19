"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export type ReportQuestionResult = { ok: true } | { error: string };

/**
 * "Laporan soal bermasalah" (Master Prompt §11) — shared by every lab's
 * post-check result view (Reading/Listening so far) rather than
 * duplicated per surface, since the shape (questionCode, reason, details)
 * never needs to differ by lab.
 */
export async function reportQuestionAction(
  questionCode: string,
  reason: string,
  details: string,
): Promise<ReportQuestionResult> {
  const user = await requireUser();
  if (!reason.trim()) return { error: "Pilih alasan laporan." };

  const question = await prisma.question.findUnique({ where: { code: questionCode } });
  if (!question) return { error: "Soal tidak ditemukan." };

  await prisma.questionReport.create({
    data: {
      questionId: question.id,
      reportedById: user.id,
      reason: reason.trim(),
      details: details.trim() || null,
    },
  });

  return { ok: true };
}
