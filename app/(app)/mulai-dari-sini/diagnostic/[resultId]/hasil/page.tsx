import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Disclaimer } from "@/components/disclaimer";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, SKILL_AREA_LABEL } from "@/lib/content/labels";
import { generateStudyPlanAction } from "../actions";

function confidenceLabel(confidence: number): string {
  if (confidence < 0.25) return "Rendah";
  if (confidence < 0.45) return "Sedang-rendah";
  return "Sedang";
}

export default async function DiagnosticResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const user = await requireUser();
  const { resultId } = await params;

  const result = await prisma.diagnosticResult.findUnique({
    where: { id: resultId },
    include: { skillEstimates: { orderBy: { scorePercent: "asc" } } },
  });
  if (!result || result.userId !== user.id) notFound();
  if (result.status !== "COMPLETED") redirect(`/mulai-dari-sini/diagnostic/${resultId}`);

  const overallCorrect = result.skillEstimates.reduce((sum, s) => sum + s.correctCount, 0);
  const overallTotal = result.skillEstimates.reduce((sum, s) => sum + s.totalCount, 0);

  async function onGeneratePlan() {
    "use server";
    await generateStudyPlanAction(resultId);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <Card className="border-brand-navy/20 bg-brand-navy/5">
        <CardHeader>
          <CardTitle>Hasil Diagnostic Test</CardTitle>
          <CardDescription>
            {overallCorrect} dari {overallTotal} jawaban benar secara keseluruhan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>
              Estimasi level:{" "}
              {result.estimatedLevel ? PEDAGOGICAL_LEVEL_LABEL[result.estimatedLevel] : "-"}
            </Badge>
            <Badge variant="outline">
              Keyakinan: {confidenceLabel(result.confidence ?? 0)} (
              {Math.round((result.confidence ?? 0) * 100)}%)
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Estimasi ini didasarkan pada {overallTotal} soal dari bank soal yang tersedia saat ini
            dan akan semakin akurat seiring bertambahnya konten dan aktivitas belajar Anda. Ini{" "}
            <strong>bukan</strong> skor resmi IELTS.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hasil per Skill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.skillEstimates.map((s) => (
            <div key={s.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{SKILL_AREA_LABEL[s.skill]}</span>
                <span className="text-muted-foreground">
                  {s.correctCount}/{s.totalCount} ({s.scorePercent}%)
                </span>
              </div>
              <Progress value={s.scorePercent} />
            </div>
          ))}
        </CardContent>
      </Card>

      <form action={onGeneratePlan}>
        <Button type="submit" size="lg" className="w-full">
          Buat Rencana Belajar Saya
        </Button>
      </form>

      <Button
        render={<Link href="/dashboard">Kembali ke Beranda</Link>}
        variant="outline"
        className="w-full"
      />

      <Disclaimer />
    </div>
  );
}
