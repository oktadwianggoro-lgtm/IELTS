import Link from "next/link";
import { Compass, ListChecks, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL } from "@/lib/content/labels";
import { startDiagnosticAction } from "./diagnostic/actions";

export default async function StartHerePage() {
  const user = await requireUser();

  const [profile, inProgress, latestCompleted] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.diagnosticResult.findFirst({
      where: { userId: user.id, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.diagnosticResult.findFirst({
      where: { userId: user.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mulai dari Sini</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Panduan singkat untuk memulai jalur belajar IELTS Anda di Success IELTS.
        </p>
      </div>

      {!profile?.onboardingCompletedAt ? (
        <Card className="border-brand-amber/30 bg-brand-amber/5">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm">Lengkapi onboarding dulu agar rekomendasi lebih akurat.</p>
            <Button render={<Link href="/onboarding">Lengkapi</Link>} size="sm" variant="outline" />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="bg-brand-teal/10 text-brand-teal flex h-10 w-10 items-center justify-center rounded-full">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg">1. Diagnostic Test</CardTitle>
            <CardDescription>
              Cari tahu perkiraan level Anda saat ini lewat soal Grammar, Vocabulary, dan sampel
              empat skill IELTS.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestCompleted ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                Estimasi terakhir:{" "}
                {latestCompleted.estimatedLevel
                  ? PEDAGOGICAL_LEVEL_LABEL[latestCompleted.estimatedLevel]
                  : "-"}
              </Badge>
              <Button
                render={
                  <Link href={`/mulai-dari-sini/diagnostic/${latestCompleted.id}/hasil`}>
                    Lihat hasil
                  </Link>
                }
                size="sm"
                variant="outline"
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Anda belum pernah mengerjakan diagnostic test. Hasilnya adalah estimasi pembelajaran,
              bukan skor resmi IELTS.
            </p>
          )}
          <form action={startDiagnosticAction}>
            <Button type="submit" size="sm">
              {inProgress
                ? "Lanjutkan Diagnostic Test"
                : latestCompleted
                  ? "Ulangi Diagnostic Test"
                  : "Mulai Diagnostic Test"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="bg-brand-navy/10 text-brand-navy flex h-10 w-10 items-center justify-center rounded-full">
            <ListChecks className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg">2. Rencana Belajar</CardTitle>
            <CardDescription>
              Setelah diagnostic test, sistem menyusun rencana belajar harian berdasarkan kelemahan
              Anda, target band, dan waktu belajar yang tersedia.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/rencana-belajar">Lihat Rencana Belajar</Link>}
            size="sm"
            variant="outline"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="bg-brand-amber/10 text-brand-amber flex h-10 w-10 items-center justify-center rounded-full">
            <Compass className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg">3. Jelajahi Materi</CardTitle>
            <CardDescription>
              Atau langsung jelajahi katalog Materi secara bebas sesuai skill dan level yang Anda
              inginkan, tanpa menunggu hasil diagnostic test.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/materi">Buka Materi</Link>} size="sm" variant="outline" />
        </CardContent>
      </Card>
    </div>
  );
}
