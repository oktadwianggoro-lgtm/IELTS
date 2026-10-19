"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { generateStudyPlan, type CandidateLesson } from "@/lib/study-plan/generate";
import { resolvePlanHorizonDays } from "@/lib/study-plan/days-until";
import type { DailyStudyMinutes } from "@prisma/client";

const DAILY_MINUTES: Record<DailyStudyMinutes, number> = {
  TEN: 10,
  TWENTY: 20,
  THIRTY: 30,
  FORTY_FIVE: 45,
  SIXTY_PLUS: 60,
};

export async function generateStudyPlanAction(
  resultId: string,
): Promise<{ error?: string } | never> {
  const user = await requireUser();

  const result = await prisma.diagnosticResult.findUnique({
    where: { id: resultId },
    include: { skillEstimates: true },
  });
  if (!result || result.userId !== user.id || result.status !== "COMPLETED") {
    return { error: "Diagnostic test belum selesai." };
  }

  const [profile, preference, lessons, progress] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
    prisma.lesson.findMany({
      where: { reviewStatus: "PUBLISHED" },
      include: { requires: { select: { prerequisiteLessonId: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      select: { lessonId: true },
    }),
  ]);

  const candidateLessons: CandidateLesson[] = lessons.map((l) => ({
    id: l.id,
    level: l.level,
    skill: l.skill,
    estimatedMinutes: l.estimatedMinutes,
    order: l.order,
    prerequisiteLessonIds: l.requires.map((r) => r.prerequisiteLessonId),
  }));

  const weakSkillsAscending = [...result.skillEstimates]
    .sort((a, b) => a.scorePercent - b.scorePercent)
    .map((s) => s.skill);

  const today = new Date();
  const dailyStudyMinutes = DAILY_MINUTES[preference?.dailyStudyMinutes ?? "TWENTY"];
  const maxDays = resolvePlanHorizonDays(profile?.testDate ?? null, today);

  const draftItems = generateStudyPlan({
    lessons: candidateLessons,
    completedLessonIds: new Set(progress.map((p) => p.lessonId)),
    weakSkillsAscending,
    estimatedLevel: result.estimatedLevel,
    dailyStudyMinutes,
    today,
    maxDays,
  });

  await prisma.$transaction([
    prisma.studyPlan.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    }),
    prisma.studyPlan.create({
      data: {
        userId: user.id,
        targetOverallBand: profile?.targetOverallBand,
        testDate: profile?.testDate,
        dailyStudyMinutes: preference?.dailyStudyMinutes ?? "TWENTY",
        generatedFromDiagnosticId: resultId,
        items: {
          create: draftItems.map((item) => ({
            lessonId: item.lessonId,
            order: item.order,
            scheduledDate: item.scheduledDate,
            reason: item.reason,
          })),
        },
      },
    }),
  ]);

  redirect("/rencana-belajar");
}
