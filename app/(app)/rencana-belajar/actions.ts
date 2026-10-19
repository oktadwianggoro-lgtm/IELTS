"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export async function markStudyPlanItemDoneAction(itemId: string): Promise<void> {
  const user = await requireUser();

  const item = await prisma.studyPlanItem.findUnique({
    where: { id: itemId },
    include: { studyPlan: true },
  });
  if (!item || item.studyPlan.userId !== user.id) return;

  await prisma.$transaction([
    prisma.studyPlanItem.update({ where: { id: itemId }, data: { status: "DONE" } }),
    prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: item.lessonId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: {
        userId: user.id,
        lessonId: item.lessonId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/rencana-belajar");
  revalidatePath("/dashboard");
}
