import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LessonView, type LessonViewData } from "@/components/content/lesson-view";
import { StatusTransitionButtons } from "@/components/content/status-transition-buttons";
import { transitionLessonStatusAction, transitionListeningPassageStatusAction } from "./actions";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { LISTENING_SECTION_LABEL, PEDAGOGICAL_LEVEL_LABEL } from "@/lib/content/labels";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Dalam Review",
  APPROVED: "Disetujui",
  PUBLISHED: "Diterbitkan",
  ARCHIVED: "Diarsipkan",
};

function QuestionListPreview({
  questions,
}: {
  questions: {
    id: string;
    prompt: unknown;
    options: unknown;
    answerKey: unknown;
    explanation: string;
  }[];
}) {
  return (
    <>
      {questions.map((q, i) => {
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
    </>
  );
}

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

  if (lesson) {
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
            <StatusTransitionButtons
              code={lesson.code}
              currentStatus={lesson.reviewStatus}
              onTransition={transitionLessonStatusAction}
            />
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
            <QuestionListPreview questions={lesson.questions} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const passage = await prisma.listeningPassage.findUnique({
    where: { code },
    include: {
      questions: { orderBy: { code: "asc" } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  if (!passage) notFound();

  const script = passage.script as { speaker: string; text: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {passage.code}
            <Badge>{STATUS_LABEL[passage.reviewStatus] ?? passage.reviewStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground grid grid-cols-2 gap-2">
            <p>Section: {LISTENING_SECTION_LABEL[passage.section]}</p>
            <p>Level: {PEDAGOGICAL_LEVEL_LABEL[passage.level]}</p>
            <p>Aksen: {passage.accent}</p>
            <p>Durasi: {Math.round(passage.durationSeconds / 60)} menit</p>
            <p>Versi konten: {passage.contentVersion}</p>
            <p>Terakhir diperbarui: {passage.lastUpdatedAt.toLocaleString("id-ID")}</p>
            {passage.reviewedBy ? (
              <p className="col-span-2">
                Ditinjau oleh: {passage.reviewedBy.name ?? passage.reviewedBy.email} pada{" "}
                {passage.reviewedAt?.toLocaleString("id-ID")}
              </p>
            ) : null}
            {passage.sourceNotes ? (
              <p className="col-span-2">Catatan sumber: {passage.sourceNotes}</p>
            ) : null}
          </div>
          <Separator />
          <StatusTransitionButtons
            code={passage.code}
            currentStatus={passage.reviewStatus}
            onTransition={transitionListeningPassageStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio & Transkrip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <audio controls src={passage.audioUrl} className="w-full" />
          <div className="space-y-1">
            {script.map((turn, i) => (
              <p key={i}>
                <span className="font-medium">{turn.speaker}:</span> {turn.text}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Soal ({passage.questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuestionListPreview questions={passage.questions} />
        </CardContent>
      </Card>
    </div>
  );
}
