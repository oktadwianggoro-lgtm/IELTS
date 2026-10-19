import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, WRITING_TASK_TYPE_LABEL } from "@/lib/content/labels";
import type { WritingTaskType } from "@prisma/client";

const TASK_TYPE_ORDER: WritingTaskType[] = ["TASK1_ACADEMIC", "TASK1_GENERAL_TRAINING", "TASK2"];

export default async function WritingLabPage() {
  const user = await requireUser();

  const [tasks, submissionCounts] = await Promise.all([
    prisma.writingTask.findMany({
      where: { reviewStatus: "PUBLISHED" },
      orderBy: [{ taskType: "asc" }, { title: "asc" }],
    }),
    prisma.writingSubmission.groupBy({
      by: ["writingTaskId"],
      where: { userId: user.id, status: "SUBMITTED" },
      _count: { _all: true },
    }),
  ]);

  const submittedCountByTaskId = new Map(
    submissionCounts.map((s) => [s.writingTaskId, s._count._all]),
  );

  const byTaskType = new Map<WritingTaskType, typeof tasks>();
  for (const t of tasks) {
    const group = byTaskType.get(t.taskType) ?? [];
    group.push(t);
    byTaskType.set(t.taskType, group);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Writing Lab</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Latih Task 1 dan Task 2 dengan outline, timer, autosave draft, dan self-assessment
          berbasis 4 kriteria IELTS Writing.
        </p>
      </div>

      {TASK_TYPE_ORDER.map((taskType) => {
        const items = byTaskType.get(taskType) ?? [];
        return (
          <Card key={taskType}>
            <CardHeader>
              <CardTitle className="text-base">{WRITING_TASK_TYPE_LABEL[taskType]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Segera tersedia.</p>
              ) : (
                items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/writing-lab/${t.code}`}
                    className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {PEDAGOGICAL_LEVEL_LABEL[t.level]} · min. {t.minWords} kata ·{" "}
                        {t.suggestedMinutes} menit
                        {(submittedCountByTaskId.get(t.id) ?? 0) > 0
                          ? ` · ${submittedCountByTaskId.get(t.id)}x dikerjakan`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">Mulai</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
