"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { estimateDiagnostic, type AnsweredQuestion } from "@/lib/diagnostic/estimate";
import { gradeAnswer } from "@/lib/content/grade-answer";

const QUESTIONS_PER_GROUP = 2;

/** Deterministic (not random) so reloading an in-progress diagnostic shows
 * the same question set instead of a new random sample each time. */
export async function sampleDiagnosticQuestions() {
  const published = await prisma.question.findMany({
    where: { reviewStatus: "PUBLISHED" },
    orderBy: { code: "asc" },
  });

  const groups = new Map<string, typeof published>();
  for (const q of published) {
    const key = `${q.skill}:${q.level}`;
    const group = groups.get(key) ?? [];
    group.push(q);
    groups.set(key, group);
  }

  return Array.from(groups.values()).flatMap((group) => group.slice(0, QUESTIONS_PER_GROUP));
}

export async function startDiagnosticAction(): Promise<never> {
  const user = await requireUser();

  const existing = await prisma.diagnosticResult.findFirst({
    where: { userId: user.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  const result = existing ?? (await prisma.diagnosticResult.create({ data: { userId: user.id } }));
  redirect(`/mulai-dari-sini/diagnostic/${result.id}`);
}

export type DiagnosticSubmitState = { error?: string } | null;

export async function submitDiagnosticAction(
  resultId: string,
  rawAnswers: Record<string, string | string[]>,
): Promise<DiagnosticSubmitState> {
  const user = await requireUser();

  const result = await prisma.diagnosticResult.findUnique({ where: { id: resultId } });
  if (!result || result.userId !== user.id) {
    return { error: "Sesi diagnostic test tidak ditemukan." };
  }
  if (result.status === "COMPLETED") {
    redirect(`/mulai-dari-sini/diagnostic/${resultId}/hasil`);
  }

  const questions = await sampleDiagnosticQuestions();
  const answeredForEstimate: AnsweredQuestion[] = [];

  await prisma.$transaction(
    questions.map((q) => {
      const submitted = rawAnswers[q.code] ?? "";
      const correct = gradeAnswer(q, submitted);
      answeredForEstimate.push({ level: q.level, skill: q.skill, correct });
      return prisma.diagnosticAnswer.upsert({
        where: {
          diagnosticResultId_questionId: { diagnosticResultId: resultId, questionId: q.id },
        },
        update: { submitted, correct },
        create: { diagnosticResultId: resultId, questionId: q.id, submitted, correct },
      });
    }),
  );

  const estimate = estimateDiagnostic(answeredForEstimate);

  await prisma.$transaction([
    prisma.diagnosticResult.update({
      where: { id: resultId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        estimatedLevel: estimate.estimatedLevel,
        confidence: estimate.confidence,
      },
    }),
    prisma.skillEstimate.deleteMany({ where: { diagnosticResultId: resultId } }),
    ...estimate.skillEstimates.map((s) =>
      prisma.skillEstimate.create({
        data: {
          diagnosticResultId: resultId,
          skill: s.skill,
          correctCount: s.correctCount,
          totalCount: s.totalCount,
          scorePercent: s.scorePercent,
        },
      }),
    ),
  ]);

  redirect(`/mulai-dari-sini/diagnostic/${resultId}/hasil`);
}
