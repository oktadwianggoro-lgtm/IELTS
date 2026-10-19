import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WritingTaskWorkspace } from "@/components/writing/writing-task-workspace";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, WRITING_TASK_TYPE_LABEL } from "@/lib/content/labels";

export default async function WritingTaskPage({
  params,
}: {
  params: Promise<{ taskCode: string }>;
}) {
  const user = await requireUser();
  const { taskCode } = await params;

  const task = await prisma.writingTask.findUnique({ where: { code: taskCode } });
  if (!task || task.reviewStatus !== "PUBLISHED") notFound();

  const latestSubmission = await prisma.writingSubmission.findFirst({
    where: { userId: user.id, writingTaskId: task.id },
    orderBy: { createdAt: "desc" },
  });

  const visualData = task.visualData as {
    type: "table";
    headers: string[];
    rows: string[][];
  } | null;

  // Only ever include sampleAnswer/checklistItems in the response if the
  // user's latest attempt at THIS task is already SUBMITTED — never before,
  // same D-021/D-034 principle every other lab in this app follows.
  const revealed = latestSubmission?.status === "SUBMITTED";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-xs">
        <Link href="/writing-lab" className="hover:underline">
          Writing Lab
        </Link>
        <span>/</span>
        <span>{task.title}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{WRITING_TASK_TYPE_LABEL[task.taskType]}</Badge>
          <Badge variant="outline">{PEDAGOGICAL_LEVEL_LABEL[task.level]}</Badge>
          <Badge variant="outline">min. {task.minWords} kata</Badge>
          <Badge variant="outline">{task.suggestedMinutes} menit</Badge>
        </CardContent>
      </Card>

      <WritingTaskWorkspace
        taskCode={task.code}
        prompt={task.prompt}
        visualData={visualData}
        minWords={task.minWords}
        suggestedMinutes={task.suggestedMinutes}
        initialSubmission={
          latestSubmission
            ? {
                id: latestSubmission.id,
                outline: latestSubmission.outline,
                body: latestSubmission.body,
                wordCount: latestSubmission.wordCount,
                status: latestSubmission.status,
                selfAssessment:
                  (latestSubmission.selfAssessment as Record<string, boolean> | null) ?? null,
              }
            : null
        }
        revealedSampleAnswer={revealed ? task.sampleAnswer : null}
        revealedChecklist={revealed ? (task.checklistItems as string[]) : null}
      />
    </div>
  );
}
