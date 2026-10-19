import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LessonView, type LessonViewData } from "@/components/content/lesson-view";
import { StatusTransitionButtons } from "@/components/content/status-transition-buttons";
import {
  transitionLessonStatusAction,
  transitionListeningPassageStatusAction,
  transitionReadingPassageStatusAction,
  transitionWritingTaskStatusAction,
} from "./actions";
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
    evidence?: string | null;
    wordLimit?: number | null;
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
              {q.wordLimit ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  (maks. {q.wordLimit} kata)
                </span>
              ) : null}
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
            {q.evidence ? (
              <p className="text-muted-foreground mt-1 text-xs">Bukti: {q.evidence}</p>
            ) : null}
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

  if (passage) {
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

  const readingPassage = await prisma.readingPassage.findUnique({
    where: { code },
    include: {
      questions: { orderBy: { code: "asc" } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  if (readingPassage) {
    const paragraphs = readingPassage.paragraphs as { label: string; text: string }[];

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {readingPassage.code}
              <Badge>
                {STATUS_LABEL[readingPassage.reviewStatus] ?? readingPassage.reviewStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-muted-foreground grid grid-cols-2 gap-2">
              <p>Exam type: {readingPassage.examType}</p>
              <p>Level: {PEDAGOGICAL_LEVEL_LABEL[readingPassage.level]}</p>
              <p>Topik: {readingPassage.topic}</p>
              <p>Jumlah kata: {readingPassage.wordCount}</p>
              <p>Versi konten: {readingPassage.contentVersion}</p>
              <p>Terakhir diperbarui: {readingPassage.lastUpdatedAt.toLocaleString("id-ID")}</p>
              {readingPassage.reviewedBy ? (
                <p className="col-span-2">
                  Ditinjau oleh: {readingPassage.reviewedBy.name ?? readingPassage.reviewedBy.email}{" "}
                  pada {readingPassage.reviewedAt?.toLocaleString("id-ID")}
                </p>
              ) : null}
              {readingPassage.sourceNotes ? (
                <p className="col-span-2">Catatan sumber: {readingPassage.sourceNotes}</p>
              ) : null}
            </div>
            <Separator />
            <StatusTransitionButtons
              code={readingPassage.code}
              currentStatus={readingPassage.reviewStatus}
              onTransition={transitionReadingPassageStatusAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Passage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {paragraphs.map((p) => (
              <p key={p.label}>
                <span className="font-medium">{p.label}.</span> {p.text}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Soal ({readingPassage.questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuestionListPreview questions={readingPassage.questions} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const writingTask = await prisma.writingTask.findUnique({
    where: { code },
    include: { reviewedBy: { select: { name: true, email: true } } },
  });

  if (!writingTask) notFound();

  const visualData = writingTask.visualData as {
    type: "table";
    headers: string[];
    rows: string[][];
  } | null;
  const checklistItems = writingTask.checklistItems as string[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {writingTask.code}
            <Badge>{STATUS_LABEL[writingTask.reviewStatus] ?? writingTask.reviewStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground grid grid-cols-2 gap-2">
            <p>Task type: {writingTask.taskType}</p>
            <p>Level: {PEDAGOGICAL_LEVEL_LABEL[writingTask.level]}</p>
            <p>Min. kata: {writingTask.minWords}</p>
            <p>Durasi disarankan: {writingTask.suggestedMinutes} menit</p>
            <p>Versi konten: {writingTask.contentVersion}</p>
            <p>Terakhir diperbarui: {writingTask.lastUpdatedAt.toLocaleString("id-ID")}</p>
            {writingTask.reviewedBy ? (
              <p className="col-span-2">
                Ditinjau oleh: {writingTask.reviewedBy.name ?? writingTask.reviewedBy.email} pada{" "}
                {writingTask.reviewedAt?.toLocaleString("id-ID")}
              </p>
            ) : null}
            {writingTask.sourceNotes ? (
              <p className="col-span-2">Catatan sumber: {writingTask.sourceNotes}</p>
            ) : null}
          </div>
          <Separator />
          <StatusTransitionButtons
            code={writingTask.code}
            currentStatus={writingTask.reviewStatus}
            onTransition={transitionWritingTaskStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm whitespace-pre-line">
          {writingTask.prompt}
          {visualData ? (
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr>
                  {visualData.headers.map((h) => (
                    <th key={h} className="border-border border p-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visualData.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-border border p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm whitespace-pre-line">
          {writingTask.sampleAnswer}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist Self-Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {checklistItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
