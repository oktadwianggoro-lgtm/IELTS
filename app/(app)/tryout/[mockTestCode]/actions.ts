"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { recordQuestionAttempt } from "@/lib/practice/record-attempt";
import { rawToBand } from "@/lib/scoring/raw-to-band";
import type { AttemptStatus } from "@prisma/client";

export type AttemptResult = {
  rawScore: number;
  maxRawScore: number;
  band: number | null;
  bandSourceUrl: string | null;
  accuracyByType: Record<string, { correct: number; total: number }>;
  timeUsedSeconds: number;
  weakTopics: { topic: string; wrongCount: number }[];
};

export type AttemptState = {
  id: string;
  status: AttemptStatus;
  deadlineAt: string;
  answers: Record<string, string | string[]>;
  flaggedQuestionCodes: string[];
  result: AttemptResult | null;
};

/**
 * Finds the user's existing IN_PROGRESS attempt for this mock test (true
 * "resume" — same attempt, not a new one), auto-finalizing it first if its
 * deadline has already passed while nobody was looking. Creates a new
 * attempt only if none exists. `deadlineAt` is computed once, here, from
 * the server clock — the sole source of truth auto-submit checks against.
 */
export async function startOrResumeAttemptAction(
  mockTestCode: string,
): Promise<AttemptState | { error: string }> {
  const user = await requireUser();
  const mockTest = await prisma.mockTest.findUnique({
    where: { code: mockTestCode },
    include: { blueprint: true },
  });
  if (!mockTest || mockTest.reviewStatus !== "PUBLISHED") {
    return { error: "Mock test tidak ditemukan." };
  }

  const existing = await prisma.attempt.findFirst({
    where: { userId: user.id, mockTestId: mockTest.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    const finalized = await finalizeIfExpired(existing.id);
    if (finalized) return toAttemptState(finalized);
    await prisma.attemptEvent.create({ data: { attemptId: existing.id, type: "resumed" } });
    return toAttemptState(existing);
  }

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + mockTest.blueprint.totalSeconds * 1000);
  const attempt = await prisma.attempt.create({
    data: { userId: user.id, mockTestId: mockTest.id, startedAt, deadlineAt },
  });
  await prisma.attemptEvent.create({ data: { attemptId: attempt.id, type: "started" } });

  return toAttemptState(attempt);
}

/** Re-reads attempt state, auto-finalizing first if the deadline has
 * passed — this is how a client that reconnects after being offline past
 * time's-up still ends up looking at a SUBMITTED result instead of being
 * stuck "in progress" forever. */
export async function getAttemptStateAction(
  attemptId: string,
): Promise<AttemptState | { error: string }> {
  const user = await requireUser();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) return { error: "Attempt tidak ditemukan." };

  const finalized = await finalizeIfExpired(attempt.id);
  return toAttemptState(finalized ?? attempt);
}

export type SaveAnswerResult = { ok: true; autoSubmitted: boolean } | { error: string };

export async function saveAnswerAction(
  attemptId: string,
  questionCode: string,
  value: string | string[],
): Promise<SaveAnswerResult> {
  const user = await requireUser();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) return { error: "Attempt tidak ditemukan." };

  const finalized = await finalizeIfExpired(attempt.id);
  if (finalized) return { ok: true, autoSubmitted: true };
  if (attempt.status !== "IN_PROGRESS") return { error: "Attempt sudah selesai." };

  const question = await prisma.question.findUnique({ where: { code: questionCode } });
  if (!question) return { error: "Soal tidak ditemukan." };

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId: question.id } },
    create: { attemptId, questionId: question.id, value },
    update: { value },
  });

  return { ok: true, autoSubmitted: false };
}

export async function toggleFlagAction(
  attemptId: string,
  questionCode: string,
): Promise<{ flaggedQuestionCodes: string[] } | { error: string }> {
  const user = await requireUser();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) return { error: "Attempt tidak ditemukan." };
  if (attempt.status !== "IN_PROGRESS") return { error: "Attempt sudah selesai." };

  const current = (attempt.flaggedQuestionCodes as string[]) ?? [];
  const next = current.includes(questionCode)
    ? current.filter((c) => c !== questionCode)
    : [...current, questionCode];

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: { flaggedQuestionCodes: next },
  });
  await prisma.attemptEvent.create({
    data: {
      attemptId,
      type: next.includes(questionCode) ? "flagged" : "unflagged",
    },
  });

  return { flaggedQuestionCodes: updated.flaggedQuestionCodes as string[] };
}

export async function submitAttemptAction(
  attemptId: string,
): Promise<AttemptState | { error: string }> {
  const user = await requireUser();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id) return { error: "Attempt tidak ditemukan." };

  const finalized =
    (await finalizeIfExpired(attempt.id)) ?? (await finalize(attempt.id, "SUBMITTED"));
  return toAttemptState(finalized);
}

/** Finalizes (grades + locks) an attempt if its deadline has passed and it
 * is still IN_PROGRESS; returns null (no-op) otherwise. Called from every
 * read/write entry point so auto-submit is enforced server-side no matter
 * which request happens to notice the deadline first — never trusted to
 * the client's own countdown alone. */
async function finalizeIfExpired(attemptId: string) {
  const attempt = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
  if (attempt.status !== "IN_PROGRESS") return null;
  if (Date.now() < attempt.deadlineAt.getTime()) return null;
  return finalize(attemptId, "AUTO_SUBMITTED");
}

async function finalize(attemptId: string, status: "SUBMITTED" | "AUTO_SUBMITTED") {
  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      mockTest: { include: { blueprint: true, sections: true } },
      answers: { include: { question: { include: { topics: { include: { topic: true } } } } } },
    },
  });
  if (attempt.status !== "IN_PROGRESS") {
    return attempt as typeof attempt & { result: AttemptResult | null };
  }

  const now = new Date();
  const timeUsedSeconds = Math.round(
    (Math.min(now.getTime(), attempt.deadlineAt.getTime()) - attempt.startedAt.getTime()) / 1000,
  );

  // All questions across every section count toward maxRawScore, even
  // ones the student never answered (an empty submission is just wrong).
  const listeningPassageIds = attempt.mockTest.sections
    .map((s) => s.listeningPassageId)
    .filter((id): id is string => Boolean(id));
  const readingPassageIds = attempt.mockTest.sections
    .map((s) => s.readingPassageId)
    .filter((id): id is string => Boolean(id));

  const allQuestions = await prisma.question.findMany({
    where: {
      OR: [
        ...(listeningPassageIds.length > 0
          ? [{ listeningPassageId: { in: listeningPassageIds } }]
          : []),
        ...(readingPassageIds.length > 0 ? [{ readingPassageId: { in: readingPassageIds } }] : []),
      ],
    },
    include: { topics: { include: { topic: true } } },
  });

  const answerByQuestionId = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const accuracyByType: Record<string, { correct: number; total: number }> = {};
  const wrongTopicCounts = new Map<string, number>();
  let rawScore = 0;

  for (const question of allQuestions) {
    const answer = answerByQuestionId.get(question.id);
    const submitted = (answer?.value as string | string[] | undefined) ?? "";

    // Grades once, logs a QuestionAttempt, and feeds Buku Kesalahan on a
    // miss — same shared helper every other graded surface uses (D-030/
    // D-034 lineage). See docs/SCORING.md §4 for why timeSpentMs is 0 here
    // (no reliable per-question timing inside one continuous whole-test
    // timer).
    const { correct } = await recordQuestionAttempt(
      attempt.userId,
      question,
      submitted,
      0,
      "TRYOUT",
    );
    if (correct) rawScore += 1;

    accuracyByType[question.type] ??= { correct: 0, total: 0 };
    accuracyByType[question.type].total += 1;
    if (correct) accuracyByType[question.type].correct += 1;

    if (!correct) {
      for (const qt of question.topics) {
        wrongTopicCounts.set(qt.topic.name, (wrongTopicCounts.get(qt.topic.name) ?? 0) + 1);
      }
    }

    if (answer) {
      await prisma.attemptAnswer.update({ where: { id: answer.id }, data: { correct } });
    }
  }

  const bandResult = await rawToBand(
    rawScore,
    attempt.mockTest.blueprint.skill,
    attempt.mockTest.blueprint.examType,
  );

  const weakTopics = [...wrongTopicCounts.entries()]
    .map(([topic, wrongCount]) => ({ topic, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  const result: AttemptResult = {
    rawScore,
    maxRawScore: allQuestions.length,
    band: bandResult.band,
    bandSourceUrl: "sourceUrl" in bandResult ? bandResult.sourceUrl : null,
    accuracyByType,
    timeUsedSeconds,
    weakTopics,
  };

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: { status, submittedAt: now, result: result as object },
  });
  await prisma.attemptEvent.create({
    data: { attemptId, type: status === "AUTO_SUBMITTED" ? "auto_submitted" : "submitted" },
  });

  return { ...updated, result } as typeof attempt & { result: AttemptResult };
}

async function toAttemptState(attempt: {
  id: string;
  status: AttemptStatus;
  deadlineAt: Date;
  flaggedQuestionCodes: unknown;
  result: unknown;
}): Promise<AttemptState> {
  const answerRows = await prisma.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
    include: { question: { select: { code: true } } },
  });
  const answers: Record<string, string | string[]> = {};
  for (const row of answerRows) {
    answers[row.question.code] = row.value as string | string[];
  }

  return {
    id: attempt.id,
    status: attempt.status,
    deadlineAt: attempt.deadlineAt.toISOString(),
    answers,
    flaggedQuestionCodes: (attempt.flaggedQuestionCodes as string[]) ?? [],
    result: (attempt.result as AttemptResult | null) ?? null,
  };
}
