import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListeningPassagePlayer } from "@/components/listening/listening-passage-player";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { LISTENING_SECTION_LABEL, PEDAGOGICAL_LEVEL_LABEL } from "@/lib/content/labels";
import type { QuizQuestionPublic } from "@/components/content/question-input";

export default async function ListeningPassagePage({
  params,
}: {
  params: Promise<{ passageCode: string }>;
}) {
  await requireUser();
  const { passageCode } = await params;

  const passage = await prisma.listeningPassage.findUnique({
    where: { code: passageCode },
    include: { questions: { where: { reviewStatus: "PUBLISHED" }, orderBy: { code: "asc" } } },
  });

  if (!passage || passage.reviewStatus !== "PUBLISHED") notFound();

  // Never include `script` (the transcript) here — it only reaches the
  // client after checkListeningAnswersAction grades the attempt, and even
  // then only in practice mode. See D-031.
  const publicQuestions: QuizQuestionPublic[] = passage.questions.map((q) => ({
    code: q.code,
    type: q.type,
    prompt: q.prompt as { text: string; instructions?: string },
    options: q.options as { id: string; text: string }[] | null,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-xs">
        <Link href="/listening-lab" className="hover:underline">
          Listening Lab
        </Link>
        <span>/</span>
        <span>{passage.title}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{passage.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{LISTENING_SECTION_LABEL[passage.section]}</Badge>
          <Badge variant="outline">{PEDAGOGICAL_LEVEL_LABEL[passage.level]}</Badge>
          <Badge variant="outline">{passage.accent}</Badge>
        </CardContent>
      </Card>

      {publicQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada soal untuk passage ini.
          </CardContent>
        </Card>
      ) : (
        <ListeningPassagePlayer
          passageCode={passage.code}
          audioUrl={passage.audioUrl}
          questions={publicQuestions}
        />
      )}
    </div>
  );
}
