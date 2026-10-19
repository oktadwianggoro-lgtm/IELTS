import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LessonView, type LessonViewData } from "@/components/content/lesson-view";
import { LessonActions } from "@/components/content/lesson-actions";
import { LessonQuiz, type QuizQuestionPublic } from "@/components/content/lesson-quiz";
import { LessonViewTracker } from "@/components/content/lesson-view-tracker";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ coursePathCode: string; moduleCode: string; lessonCode: string }>;
}) {
  const user = await requireUser();
  const { coursePathCode, moduleCode, lessonCode } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { code: lessonCode },
    include: {
      module: { include: { coursePath: true } },
      questions: { orderBy: { code: "asc" } },
      requires: { include: { prerequisiteLesson: true } },
    },
  });

  if (
    !lesson ||
    lesson.reviewStatus !== "PUBLISHED" ||
    lesson.module.code !== moduleCode ||
    lesson.module.coursePath.code !== coursePathCode
  ) {
    notFound();
  }

  const [bookmark, note, progress, siblings] = await Promise.all([
    prisma.bookmark.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.note.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.lesson.findMany({
      where: { moduleId: lesson.moduleId, reviewStatus: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { code: true, title: true, order: true },
    }),
  ]);

  const currentIndex = siblings.findIndex((s) => s.code === lesson.code);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const lessonView: LessonViewData = {
    title: lesson.title,
    level: lesson.level,
    skill: lesson.skill,
    targetBandRange: lesson.targetBandRange,
    estimatedMinutes: lesson.estimatedMinutes,
    objectives: lesson.objectives as string[],
    content: lesson.content as LessonViewData["content"],
  };

  const publicQuestions: QuizQuestionPublic[] = lesson.questions.map((q) => ({
    code: q.code,
    type: q.type,
    prompt: q.prompt as { text: string; instructions?: string },
    options: q.options as { id: string; text: string }[] | null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <LessonViewTracker lessonCode={lesson.code} />

      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
        <Link href="/materi" className="hover:underline">
          Materi
        </Link>
        <span>/</span>
        <Link href={`/materi/${coursePathCode}`} className="hover:underline">
          {lesson.module.coursePath.title}
        </Link>
        <span>/</span>
        <Link href={`/materi/${coursePathCode}/${moduleCode}`} className="hover:underline">
          {lesson.module.title}
        </Link>
      </nav>

      {lesson.requires.length > 0 ? (
        <Card className="border-brand-amber/30 bg-brand-amber/5">
          <CardContent className="py-3 text-sm">
            <span className="font-medium">Prasyarat:</span>{" "}
            {lesson.requires.map((r) => r.prerequisiteLesson.title).join(", ")}
          </CardContent>
        </Card>
      ) : null}

      <LessonView lesson={lessonView} />

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Mini-quiz</h2>
        <LessonQuiz questions={publicQuestions} />
      </div>

      <Separator />

      <LessonActions
        lessonCode={lesson.code}
        initialBookmarked={Boolean(bookmark)}
        initialNote={note?.body ?? ""}
        initialCompleted={progress?.status === "COMPLETED"}
      />

      <div className="flex items-center justify-between pt-2">
        {prevLesson ? (
          <Button
            render={
              <Link href={`/materi/${coursePathCode}/${moduleCode}/${prevLesson.code}`}>
                <ChevronLeft className="h-4 w-4" /> {prevLesson.title}
              </Link>
            }
            variant="outline"
          />
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Button
            render={
              <Link href={`/materi/${coursePathCode}/${moduleCode}/${nextLesson.code}`}>
                {nextLesson.title} <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
