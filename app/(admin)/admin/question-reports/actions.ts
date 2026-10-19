"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import type { QuestionReportStatus } from "@prisma/client";

export async function resolveQuestionReportAction(
  reportId: string,
  status: Extract<QuestionReportStatus, "RESOLVED" | "DISMISSED">,
  resolutionNotes: string,
): Promise<{ error?: string } | null> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const report = await prisma.questionReport.findUnique({ where: { id: reportId } });
  if (!report) return { error: "Laporan tidak ditemukan." };
  if (report.status !== "OPEN") return { error: "Laporan ini sudah ditindaklanjuti." };

  await prisma.questionReport.update({
    where: { id: reportId },
    data: {
      status,
      resolvedById: user.id,
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes.trim() || null,
    },
  });

  await logAuditEvent(user.id, "question_report_resolved", "QuestionReport", reportId, {
    questionId: report.questionId,
    status,
  });

  revalidatePath("/admin/question-reports");
  return null;
}
