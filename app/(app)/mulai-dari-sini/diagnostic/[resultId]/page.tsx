import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagnosticQuizForm } from "@/components/diagnostic/diagnostic-quiz-form";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { sampleDiagnosticQuestions } from "../actions";
import type { QuizQuestionPublic } from "@/components/content/question-input";

export default async function DiagnosticTestPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const user = await requireUser();
  const { resultId } = await params;

  const result = await prisma.diagnosticResult.findUnique({ where: { id: resultId } });
  if (!result || result.userId !== user.id) notFound();
  if (result.status === "COMPLETED") redirect(`/mulai-dari-sini/diagnostic/${resultId}/hasil`);

  const questions = await sampleDiagnosticQuestions();
  const publicQuestions: QuizQuestionPublic[] = questions.map((q) => ({
    code: q.code,
    type: q.type,
    prompt: q.prompt as { text: string; instructions?: string },
    options: q.options as { id: string; text: string }[] | null,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Test</CardTitle>
          <CardDescription>
            Jawab semua pertanyaan di bawah, lalu klik &quot;Lihat Hasil&quot;. Ini bukan tes resmi
            IELTS — hasilnya adalah estimasi awal untuk membantu menyusun rencana belajar Anda.
          </CardDescription>
        </CardHeader>
      </Card>

      {publicQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada soal yang bisa dipakai untuk diagnostic test saat ini. Coba lagi nanti setelah
            lebih banyak materi diterbitkan.
          </CardContent>
        </Card>
      ) : (
        <DiagnosticQuizForm resultId={resultId} questions={publicQuestions} />
      )}
    </div>
  );
}
