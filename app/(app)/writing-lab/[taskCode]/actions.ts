"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { countWords } from "@/lib/content/word-count";

export type SubmissionDraft = {
  id: string;
  outline: string;
  body: string;
  wordCount: number;
  status: "DRAFT" | "SUBMITTED";
};

export async function startWritingSubmissionAction(
  taskCode: string,
): Promise<SubmissionDraft | { error: string }> {
  const user = await requireUser();
  const task = await prisma.writingTask.findUnique({ where: { code: taskCode } });
  if (!task || task.reviewStatus !== "PUBLISHED") {
    return { error: "Writing task tidak ditemukan." };
  }

  const submission = await prisma.writingSubmission.create({
    data: { userId: user.id, writingTaskId: task.id },
  });

  return {
    id: submission.id,
    outline: submission.outline,
    body: submission.body,
    wordCount: submission.wordCount,
    status: submission.status,
  };
}

export type SaveDraftResult = { wordCount: number } | { error: string };

export async function saveDraftAction(
  submissionId: string,
  outline: string,
  body: string,
): Promise<SaveDraftResult> {
  const user = await requireUser();
  const submission = await prisma.writingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== user.id) return { error: "Draft tidak ditemukan." };
  if (submission.status !== "DRAFT") return { error: "Draft sudah disubmit, tidak bisa diedit." };

  const wordCount = countWords(body);
  const history = Array.isArray(submission.draftHistory)
    ? (submission.draftHistory as { body: string; wordCount: number; savedAt: string }[])
    : [];
  // Keep the most recent 20 saves — enough for a meaningful history view
  // without the JSON column growing unbounded over a long writing session.
  const nextHistory = [{ body, wordCount, savedAt: new Date().toISOString() }, ...history].slice(
    0,
    20,
  );

  await prisma.writingSubmission.update({
    where: { id: submissionId },
    data: { outline, body, wordCount, draftHistory: nextHistory },
  });

  return { wordCount };
}

export type SubmitResult = { sampleAnswer: string; checklistItems: string[] } | { error: string };

/** Reveals the sample answer and self-assessment checklist only once the
 * submission is actually SUBMITTED — same D-021/D-034 principle as every
 * other lab: never send answer-adjacent content before the right moment.
 *
 * Takes the current outline/body directly from the client instead of
 * trusting whatever the debounced autosave last persisted — the autosave
 * runs on a 1500ms timer, so a submit click that lands before it fires
 * would otherwise read a stale (possibly empty) body from the DB and
 * reject a perfectly non-empty submission (D-035). */
export async function submitWritingAction(
  submissionId: string,
  outline: string,
  body: string,
): Promise<SubmitResult> {
  const user = await requireUser();
  const submission = await prisma.writingSubmission.findUnique({
    where: { id: submissionId },
    include: { writingTask: true },
  });
  if (!submission || submission.userId !== user.id) return { error: "Draft tidak ditemukan." };

  if (submission.status === "SUBMITTED") {
    return {
      sampleAnswer: submission.writingTask.sampleAnswer,
      checklistItems: submission.writingTask.checklistItems as string[],
    };
  }
  if (body.trim().length === 0) {
    return { error: "Tulisan masih kosong — tidak ada yang bisa disubmit." };
  }

  await prisma.writingSubmission.update({
    where: { id: submissionId },
    data: {
      outline,
      body,
      wordCount: countWords(body),
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return {
    sampleAnswer: submission.writingTask.sampleAnswer,
    checklistItems: submission.writingTask.checklistItems as string[],
  };
}

export async function updateSelfAssessmentAction(
  submissionId: string,
  selfAssessment: Record<string, boolean>,
): Promise<void> {
  const user = await requireUser();
  const submission = await prisma.writingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== user.id) return;

  await prisma.writingSubmission.update({ where: { id: submissionId }, data: { selfAssessment } });
}
