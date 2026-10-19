import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MistakeReviewSession } from "@/components/mistake-book/mistake-review-session";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SKILL_AREA_LABEL } from "@/lib/content/labels";
import type { SkillArea } from "@prisma/client";

const REVIEW_BATCH_SIZE = 20;

export default async function BukuKesalahanPage() {
  const user = await requireUser();
  const now = new Date();

  const [dueEntries, totalActive, allEntriesForStats] = await Promise.all([
    prisma.mistakeBookEntry.findMany({
      where: { userId: user.id, nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: "asc" },
      take: REVIEW_BATCH_SIZE,
      include: { question: true },
    }),
    prisma.mistakeBookEntry.count({ where: { userId: user.id } }),
    prisma.mistakeBookEntry.findMany({
      where: { userId: user.id },
      select: { question: { select: { skill: true } } },
    }),
  ]);

  const skillCounts = new Map<SkillArea, number>();
  for (const entry of allEntriesForStats) {
    const skill = entry.question.skill;
    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
  }
  const recurringSkills = Array.from(skillCounts.entries()).sort((a, b) => b[1] - a[1]);

  const reviewItems = dueEntries.map((entry) => ({
    entryId: entry.id,
    question: {
      code: entry.question.code,
      type: entry.question.type,
      prompt: entry.question.prompt as { text: string; instructions?: string },
      options: entry.question.options as { id: string; text: string }[] | null,
    },
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buku Kesalahan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Soal yang pernah Anda jawab salah dijadwalkan ulang otomatis lewat spaced repetition
          (SM-2) supaya muncul lagi tepat sebelum Anda lupa.
        </p>
      </div>

      {totalActive === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada kesalahan tersimpan. Kerjakan{" "}
            <Link href="/latihan-harian" className="underline">
              Latihan Harian
            </Link>{" "}
            untuk mulai mengisi Buku Kesalahan Anda.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {dueEntries.length} soal siap direview hari ini
              </CardTitle>
              <CardDescription>
                {totalActive} total soal tersimpan di Buku Kesalahan Anda.
              </CardDescription>
            </CardHeader>
            {recurringSkills.length > 0 ? (
              <CardContent className="flex flex-wrap gap-1.5">
                {recurringSkills.map(([skill, count]) => (
                  <Badge key={skill} variant="outline">
                    {SKILL_AREA_LABEL[skill]}: {count}
                  </Badge>
                ))}
              </CardContent>
            ) : null}
          </Card>

          {reviewItems.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Tidak ada review yang jatuh tempo hari ini. Kembali lagi nanti.
              </CardContent>
            </Card>
          ) : (
            <MistakeReviewSession items={reviewItems} />
          )}
        </>
      )}
    </div>
  );
}
