"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import type { ContentStatus, Role } from "@prisma/client";

type Transition = { to: ContentStatus; allowedRoles: Role[] };

/** Server-side source of truth for the editorial workflow — the UI only
 * shows buttons that match this, but every transition is re-checked here
 * regardless of what the client sent. Shared by both `Lesson` and
 * `ListeningPassage` (Fase 7) since both go through the identical
 * DRAFT→IN_REVIEW→APPROVED→PUBLISHED(/ARCHIVED) workflow. */
const TRANSITIONS: Record<ContentStatus, Transition[]> = {
  DRAFT: [{ to: "IN_REVIEW", allowedRoles: ["TEACHER", "ADMIN"] }],
  IN_REVIEW: [
    { to: "DRAFT", allowedRoles: ["TEACHER", "ADMIN"] },
    { to: "APPROVED", allowedRoles: ["ADMIN"] },
  ],
  APPROVED: [
    { to: "PUBLISHED", allowedRoles: ["ADMIN"] },
    { to: "DRAFT", allowedRoles: ["ADMIN"] },
  ],
  PUBLISHED: [{ to: "ARCHIVED", allowedRoles: ["ADMIN"] }],
  ARCHIVED: [{ to: "DRAFT", allowedRoles: ["ADMIN"] }],
};

export type ContentActionState = { error?: string } | null;

export async function transitionLessonStatusAction(
  lessonCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const lesson = await prisma.lesson.findUnique({ where: { code: lessonCode } });
  if (!lesson) return { error: "Lesson tidak ditemukan." };

  const allowed = TRANSITIONS[lesson.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${lesson.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // Fase 2's CMS reviews a lesson and its mini-quiz as one unit (there's no
  // separate per-question review UI yet), so a lesson's questions follow its
  // PUBLISHED/ARCHIVED status — otherwise a "published" lesson's quiz (and
  // anything else, like the Fase 5 diagnostic, that correctly filters
  // questions by reviewStatus) silently has zero visible questions.
  await prisma.$transaction([
    prisma.lesson.update({
      where: { code: lessonCode },
      data: {
        reviewStatus: targetStatus,
        ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
      },
    }),
    ...(targetStatus === "PUBLISHED" || targetStatus === "ARCHIVED"
      ? [
          prisma.question.updateMany({
            where: { lessonId: lesson.id },
            data: { reviewStatus: targetStatus },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/admin/content/${lessonCode}`);
  revalidatePath("/admin/content");
  return null;
}

export async function transitionListeningPassageStatusAction(
  passageCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const passage = await prisma.listeningPassage.findUnique({ where: { code: passageCode } });
  if (!passage) return { error: "Listening passage tidak ditemukan." };

  const allowed = TRANSITIONS[passage.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${passage.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // Same cascade rationale as transitionLessonStatusAction above (see
  // D-024): a passage's questions must follow its PUBLISHED/ARCHIVED status
  // or the Listening Lab silently shows "no questions" for a passage that
  // looks published.
  await prisma.$transaction([
    prisma.listeningPassage.update({
      where: { code: passageCode },
      data: {
        reviewStatus: targetStatus,
        ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
      },
    }),
    ...(targetStatus === "PUBLISHED" || targetStatus === "ARCHIVED"
      ? [
          prisma.question.updateMany({
            where: { listeningPassageId: passage.id },
            data: { reviewStatus: targetStatus },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/admin/content/${passageCode}`);
  revalidatePath("/admin/content");
  return null;
}

export async function transitionReadingPassageStatusAction(
  passageCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const passage = await prisma.readingPassage.findUnique({ where: { code: passageCode } });
  if (!passage) return { error: "Reading passage tidak ditemukan." };

  const allowed = TRANSITIONS[passage.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${passage.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // Same cascade rationale as transitionLessonStatusAction above (see
  // D-024): a passage's questions must follow its PUBLISHED/ARCHIVED status
  // or the Reading Lab silently shows "no questions" for a passage that
  // looks published.
  await prisma.$transaction([
    prisma.readingPassage.update({
      where: { code: passageCode },
      data: {
        reviewStatus: targetStatus,
        ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
      },
    }),
    ...(targetStatus === "PUBLISHED" || targetStatus === "ARCHIVED"
      ? [
          prisma.question.updateMany({
            where: { readingPassageId: passage.id },
            data: { reviewStatus: targetStatus },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/admin/content/${passageCode}`);
  revalidatePath("/admin/content");
  return null;
}

export async function transitionWritingTaskStatusAction(
  taskCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const task = await prisma.writingTask.findUnique({ where: { code: taskCode } });
  if (!task) return { error: "Writing task tidak ditemukan." };

  const allowed = TRANSITIONS[task.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${task.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // No nested `Question` cascade needed here (unlike Lesson/Listening/
  // Reading) — a WritingTask is free-response and has no Question rows.
  await prisma.writingTask.update({
    where: { code: taskCode },
    data: {
      reviewStatus: targetStatus,
      ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
    },
  });

  revalidatePath(`/admin/content/${taskCode}`);
  revalidatePath("/admin/content");
  return null;
}

export async function transitionSpeakingPromptStatusAction(
  promptCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const prompt = await prisma.speakingPrompt.findUnique({ where: { code: promptCode } });
  if (!prompt) return { error: "Speaking prompt tidak ditemukan." };

  const allowed = TRANSITIONS[prompt.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${prompt.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // No nested `Question` cascade needed here either — free-response, same
  // rationale as WritingTask.
  await prisma.speakingPrompt.update({
    where: { code: promptCode },
    data: {
      reviewStatus: targetStatus,
      ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
    },
  });

  revalidatePath(`/admin/content/${promptCode}`);
  revalidatePath("/admin/content");
  return null;
}

export async function transitionMockTestStatusAction(
  mockTestCode: string,
  targetStatus: ContentStatus,
): Promise<ContentActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const mockTest = await prisma.mockTest.findUnique({ where: { code: mockTestCode } });
  if (!mockTest) return { error: "Mock test tidak ditemukan." };

  const allowed = TRANSITIONS[mockTest.reviewStatus].find((t) => t.to === targetStatus);
  if (!allowed) {
    return { error: `Tidak bisa pindah dari ${mockTest.reviewStatus} ke ${targetStatus}.` };
  }
  if (!allowed.allowedRoles.includes(user.role)) {
    return { error: "Anda tidak punya izin untuk tindakan ini." };
  }

  const isReviewDecision = targetStatus === "APPROVED" || targetStatus === "PUBLISHED";

  // No nested cascade needed — a MockTestSection references an existing
  // Listening/ReadingPassage's own review status, it doesn't carry one of
  // its own to cascade.
  await prisma.mockTest.update({
    where: { code: mockTestCode },
    data: {
      reviewStatus: targetStatus,
      ...(isReviewDecision ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
    },
  });

  revalidatePath(`/admin/content/${mockTestCode}`);
  revalidatePath("/admin/content");
  return null;
}
