import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttemptRunner, type AttemptSectionData } from "@/components/tryout/attempt-runner";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function MockTestPage({
  params,
}: {
  params: Promise<{ mockTestCode: string }>;
}) {
  const user = await requireUser();
  const { mockTestCode } = await params;

  const mockTest = await prisma.mockTest.findUnique({
    where: { code: mockTestCode },
    include: {
      blueprint: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          listeningPassage: {
            include: { questions: { orderBy: { code: "asc" } } },
          },
          readingPassage: {
            include: { questions: { orderBy: { code: "asc" } } },
          },
        },
      },
    },
  });
  if (!mockTest || mockTest.reviewStatus !== "PUBLISHED") notFound();

  // Never sent to the client at any point during an attempt — this is
  // exam mode only in this phase (no per-question explanation/evidence
  // review like the Lab's practice mode; see D-038). Only prompt/options/
  // type/wordLimit, matching every other lab's QuizQuestionPublic shape.
  const sections: AttemptSectionData[] = mockTest.sections.map((s) => {
    if (s.listeningPassage) {
      return {
        order: s.order,
        skill: "LISTENING" as const,
        title: s.listeningPassage.title,
        audioUrl: s.listeningPassage.audioUrl,
        paragraphs: null,
        questions: s.listeningPassage.questions.map((q) => ({
          code: q.code,
          type: q.type,
          prompt: q.prompt as { text: string; instructions?: string },
          options: q.options as { id: string; text: string }[] | null,
          wordLimit: q.wordLimit,
        })),
      };
    }
    const readingPassage = s.readingPassage!;
    return {
      order: s.order,
      skill: "READING" as const,
      title: readingPassage.title,
      audioUrl: null,
      paragraphs: readingPassage.paragraphs as { label: string; text: string }[],
      questions: readingPassage.questions.map((q) => ({
        code: q.code,
        type: q.type,
        prompt: q.prompt as { text: string; instructions?: string },
        options: q.options as { id: string; text: string }[] | null,
        wordLimit: q.wordLimit,
      })),
    };
  });

  const latestAttempt = await prisma.attempt.findFirst({
    where: { userId: user.id, mockTestId: mockTest.id },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-xs">
        <Link href="/tryout" className="hover:underline">
          Tryout IELTS
        </Link>
        <span>/</span>
        <span>{mockTest.title}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{mockTest.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{mockTest.blueprint.examType}</Badge>
          <Badge variant="outline">{mockTest.blueprint.skill}</Badge>
          <Badge variant="outline">{Math.round(mockTest.blueprint.totalSeconds / 60)} menit</Badge>
        </CardContent>
      </Card>

      <AttemptRunner
        mockTestCode={mockTest.code}
        sections={sections}
        latestAttemptId={latestAttempt?.id ?? null}
      />
    </div>
  );
}
