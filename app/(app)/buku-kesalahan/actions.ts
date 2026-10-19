"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { describeExpectedAnswer, gradeAnswer } from "@/lib/content/grade-answer";
import { sm2Review, type SM2Quality, type SM2State } from "@/lib/srs/sm2";

export type MistakeCheckResult =
  | { correct: boolean; explanation: string; expected: string; lessonHref: string | null }
  | { error: string };

/** Grades one Buku Kesalahan review card. Does NOT advance the SM-2 state —
 * that only happens once the user rates recall quality in
 * `rateMistakeReviewAction`, mirroring a standard Anki-style "see the
 * answer, then rate yourself" flow. */
export async function checkMistakeReviewAction(
  entryId: string,
  submitted: string | string[],
  timeSpentMs: number,
): Promise<MistakeCheckResult> {
  const user = await requireUser();

  const entry = await prisma.mistakeBookEntry.findUnique({
    where: { id: entryId },
    include: {
      question: {
        include: { lesson: { include: { module: { include: { coursePath: true } } } } },
      },
    },
  });
  if (!entry || entry.userId !== user.id) return { error: "Kartu review tidak ditemukan." };

  const correct = gradeAnswer(entry.question, submitted);

  await prisma.questionAttempt.create({
    data: {
      userId: user.id,
      questionId: entry.questionId,
      source: "MISTAKE_REVIEW",
      submitted,
      correct,
      timeSpentMs: Math.max(0, Math.round(timeSpentMs)),
    },
  });

  const lesson = entry.question.lesson;
  const lessonHref = lesson
    ? `/materi/${lesson.module.coursePath.code}/${lesson.module.code}/${lesson.code}`
    : null;

  return {
    correct,
    explanation: entry.question.explanation,
    expected: describeExpectedAnswer(entry.question),
    lessonHref,
  };
}

/**
 * Applies the SM-2 update for one review (see lib/srs/sm2.ts) and
 * reschedules the card's `nextReviewAt`.
 *
 * Deliberately does NOT `revalidatePath("/buku-kesalahan")`. That used to
 * live-update the page's "X soal siap direview" counter after every rating,
 * but it also forces the Server Component to re-render mid-session — once
 * the user rates their LAST due card, the server's own due-count hits
 * zero, and the page's `reviewItems.length === 0` branch swaps the entire
 * `MistakeReviewSession` (destroying its "Review selesai" completion
 * state) for the generic "Tidak ada review" empty state, so the user never
 * sees their own completion summary. Letting the header counter go stale
 * until the next real visit is the smaller tradeoff — see D-032.
 */
export async function rateMistakeReviewAction(entryId: string, quality: SM2Quality): Promise<void> {
  const user = await requireUser();

  const entry = await prisma.mistakeBookEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== user.id) return;

  const state: SM2State = {
    intervalDays: entry.intervalDays,
    easeFactor: entry.easeFactor,
    repetitions: entry.repetitions,
  };
  const now = new Date();
  const { state: next, nextReviewAt } = sm2Review(state, quality, now);

  await prisma.mistakeBookEntry.update({
    where: { id: entryId },
    data: {
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
      nextReviewAt,
      lastReviewedAt: now,
      reviewCount: { increment: 1 },
    },
  });
}
