import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadingPassageWorkspace } from "@/components/reading/reading-passage-workspace";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, READING_EXAM_TYPE_LABEL } from "@/lib/content/labels";
import type { QuizQuestionPublic } from "@/components/content/question-input";

export default async function ReadingPassagePage({
  params,
}: {
  params: Promise<{ passageCode: string }>;
}) {
  await requireUser();
  const { passageCode } = await params;

  const passage = await prisma.readingPassage.findUnique({
    where: { code: passageCode },
    include: { questions: { where: { reviewStatus: "PUBLISHED" }, orderBy: { code: "asc" } } },
  });

  if (!passage || passage.reviewStatus !== "PUBLISHED") notFound();

  const paragraphs = passage.paragraphs as { label: string; text: string }[];

  // Never include `evidence`/`answerKey` here — those only reach the client
  // after checkReadingAnswersAction grades the attempt. See D-034.
  const publicQuestions: (QuizQuestionPublic & { wordLimit: number | null })[] =
    passage.questions.map((q) => ({
      code: q.code,
      type: q.type,
      prompt: q.prompt as { text: string; instructions?: string },
      options: q.options as { id: string; text: string }[] | null,
      wordLimit: q.wordLimit,
    }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-xs">
        <Link href="/reading-lab" className="hover:underline">
          Reading Lab
        </Link>
        <span>/</span>
        <span>{passage.title}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{passage.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{READING_EXAM_TYPE_LABEL[passage.examType]}</Badge>
          <Badge variant="outline">{PEDAGOGICAL_LEVEL_LABEL[passage.level]}</Badge>
          <Badge variant="outline">{passage.topic}</Badge>
          <Badge variant="outline">{passage.wordCount} kata</Badge>
        </CardContent>
      </Card>

      {publicQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada soal untuk passage ini.
          </CardContent>
        </Card>
      ) : (
        <ReadingPassageWorkspace
          passageCode={passage.code}
          paragraphs={paragraphs}
          questions={publicQuestions}
        />
      )}
    </div>
  );
}
