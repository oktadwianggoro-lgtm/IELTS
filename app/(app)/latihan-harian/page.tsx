import { Card, CardContent } from "@/components/ui/card";
import { PracticeSessionForm } from "@/components/practice/practice-session-form";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { generatePracticeSet, type PracticeCandidate } from "@/lib/practice/generate-set";
import type { QuizQuestionPublic } from "@/components/content/question-input";

const SET_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function LatihanHarianPage() {
  const user = await requireUser();
  const now = new Date();

  const [allQuestions, latestDiagnostic, recentProgress, dueMistakes] = await Promise.all([
    prisma.question.findMany({
      // Listening questions need their passage's audio for context — see
      // docs/DECISIONS.md D-030. They're scoped to the Listening Lab only.
      where: { reviewStatus: "PUBLISHED", listeningPassageId: null },
      select: {
        id: true,
        code: true,
        skill: true,
        lessonId: true,
        type: true,
        prompt: true,
        options: true,
      },
    }),
    prisma.diagnosticResult.findFirst({
      where: { userId: user.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { skillEstimates: { orderBy: { scorePercent: "asc" } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { lessonId: true },
    }),
    prisma.mistakeBookEntry.findMany({
      where: { userId: user.id, nextReviewAt: { lte: now } },
      select: { questionId: true },
    }),
  ]);

  const candidates: PracticeCandidate[] = allQuestions.map((q) => ({
    questionId: q.id,
    skill: q.skill,
    lessonId: q.lessonId,
  }));

  const selected = generatePracticeSet({
    candidates: shuffle(candidates),
    weakSkillsAscending: (latestDiagnostic?.skillEstimates ?? []).map((s) => s.skill),
    recentLessonIds: new Set(recentProgress.map((p) => p.lessonId)),
    dueReviewQuestionIds: new Set(dueMistakes.map((m) => m.questionId)),
    size: SET_SIZE,
  });

  const byId = new Map(allQuestions.map((q) => [q.id, q]));
  const publicQuestions: QuizQuestionPublic[] = selected
    .map((s) => byId.get(s.questionId))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      code: q.code,
      type: q.type,
      prompt: q.prompt as { text: string; instructions?: string },
      options: q.options as { id: string; text: string }[] | null,
    }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Latihan Harian</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set latihan adaptif: campuran soal dari area kelemahan Anda, materi yang baru dipelajari,
          dan review Buku Kesalahan yang sudah jatuh tempo.
        </p>
      </div>

      {publicQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada soal yang bisa dipakai untuk latihan adaptif saat ini. Coba lagi nanti setelah
            lebih banyak materi diterbitkan.
          </CardContent>
        </Card>
      ) : (
        <PracticeSessionForm questions={publicQuestions} />
      )}
    </div>
  );
}
