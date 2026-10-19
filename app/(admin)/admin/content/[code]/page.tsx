import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LessonView, type LessonViewData } from "@/components/content/lesson-view";
import { StatusTransitionButtons } from "@/components/content/status-transition-buttons";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Dalam Review",
  APPROVED: "Disetujui",
  PUBLISHED: "Diterbitkan",
  ARCHIVED: "Diarsipkan",
};

export default async function AdminContentDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireRole(["ADMIN", "TEACHER"]);
  const { code } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { code },
    include: {
      module: { include: { coursePath: true } },
      questions: { orderBy: { code: "asc" } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  if (!lesson) notFound();

  const lessonView: LessonViewData = {
    title: lesson.title,
    level: lesson.level,
    skill: lesson.skill,
    targetBandRange: lesson.targetBandRange,
    estimatedMinutes: lesson.estimatedMinutes,
    objectives: lesson.objectives as string[],
    content: lesson.content as LessonViewData["content"],
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {lesson.code}
            <Badge>{STATUS_LABEL[lesson.reviewStatus] ?? lesson.reviewStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground grid grid-cols-2 gap-2">
            <p>Jalur: {lesson.module.coursePath.title}</p>
            <p>Module: {lesson.module.title}</p>
            <p>Versi konten: {lesson.contentVersion}</p>
            <p>Terakhir diperbarui: {lesson.lastUpdatedAt.toLocaleString("id-ID")}</p>
            {lesson.reviewedBy ? (
              <p className="col-span-2">
                Ditinjau oleh: {lesson.reviewedBy.name ?? lesson.reviewedBy.email} pada{" "}
                {lesson.reviewedAt?.toLocaleString("id-ID")}
              </p>
            ) : null}
            {lesson.sourceNotes ? (
              <p className="col-span-2">Catatan sumber: {lesson.sourceNotes}</p>
            ) : null}
          </div>
          <Separator />
          <StatusTransitionButtons lessonCode={lesson.code} currentStatus={lesson.reviewStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pratinjau Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonView lesson={lessonView} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mini-quiz ({lesson.questions.length} soal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lesson.questions.map((q, i) => {
            const prompt = q.prompt as { text: string; instructions?: string };
            const options = q.options as { id: string; text: string }[] | null;
            return (
              <div key={q.id} className="border-border rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {i + 1}. {prompt.text}
                </p>
                {prompt.instructions ? (
                  <p className="text-muted-foreground text-xs">{prompt.instructions}</p>
                ) : null}
                {options ? (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5">
                    {options.map((o) => (
                      <li key={o.id}>
                        {o.id}. {o.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-muted-foreground mt-2 text-xs">
                  Jawaban: {JSON.stringify(q.answerKey)} — {q.explanation}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
