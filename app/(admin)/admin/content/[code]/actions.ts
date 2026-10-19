"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import type { ContentStatus, Role } from "@prisma/client";

type Transition = { to: ContentStatus; allowedRoles: Role[] };

/** Server-side source of truth for the editorial workflow — the UI only
 * shows buttons that match this, but every transition is re-checked here
 * regardless of what the client sent. */
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
