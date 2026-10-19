import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function TryoutPage() {
  const user = await requireUser();

  const mockTests = await prisma.mockTest.findMany({
    where: { reviewStatus: "PUBLISHED" },
    include: { blueprint: true },
    orderBy: [{ blueprint: { skill: "asc" } }, { title: "asc" }],
  });

  const latestAttempts = await prisma.attempt.findMany({
    where: { userId: user.id, mockTestId: { in: mockTests.map((t) => t.id) } },
    orderBy: { startedAt: "desc" },
  });
  const latestByMockTestId = new Map<string, (typeof latestAttempts)[number]>();
  for (const a of latestAttempts) {
    if (!latestByMockTestId.has(a.mockTestId)) latestByMockTestId.set(a.mockTestId, a);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tryout IELTS</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sectional test dan mini mock dalam mode ujian: timer berkelanjutan, navigator soal,
          flag/review, autosave, dan auto-submit saat waktu habis.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-2 py-4">
          {mockTests.length === 0 ? (
            <p className="text-muted-foreground text-sm">Segera tersedia.</p>
          ) : (
            mockTests.map((t) => {
              const latest = latestByMockTestId.get(t.id);
              const label =
                !latest || latest.status !== "IN_PROGRESS"
                  ? latest
                    ? "Lihat Hasil / Ulangi"
                    : "Mulai"
                  : "Lanjutkan";
              return (
                <Link
                  key={t.id}
                  href={`/tryout/${t.code}`}
                  className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.blueprint.examType} · {t.blueprint.skill} ·{" "}
                      {Math.round(t.blueprint.totalSeconds / 60)} menit
                    </p>
                  </div>
                  <Badge variant="outline">{label}</Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
