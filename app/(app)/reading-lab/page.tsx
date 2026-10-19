import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, READING_EXAM_TYPE_LABEL } from "@/lib/content/labels";
import type { ReadingExamType } from "@prisma/client";

const EXAM_TYPE_ORDER: ReadingExamType[] = ["ACADEMIC", "GENERAL_TRAINING"];

export default async function ReadingLabPage() {
  await requireUser();

  const passages = await prisma.readingPassage.findMany({
    where: { reviewStatus: "PUBLISHED" },
    orderBy: [{ examType: "asc" }, { title: "asc" }],
    include: { _count: { select: { questions: true } } },
  });

  const byExamType = new Map<ReadingExamType, typeof passages>();
  for (const p of passages) {
    const group = byExamType.get(p.examType) ?? [];
    group.push(p);
    byExamType.set(p.examType, group);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reading Lab</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Latih Reading lewat passage asli dengan navigasi paragraf, highlight, dan ulasan berbasis
          bukti dari teks.
        </p>
      </div>

      {EXAM_TYPE_ORDER.map((examType) => {
        const items = byExamType.get(examType) ?? [];
        return (
          <Card key={examType}>
            <CardHeader>
              <CardTitle className="text-base">{READING_EXAM_TYPE_LABEL[examType]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Segera tersedia.</p>
              ) : (
                items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/reading-lab/${p.code}`}
                    className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {PEDAGOGICAL_LEVEL_LABEL[p.level]} · {p.topic} · {p.wordCount} kata ·{" "}
                        {p._count.questions} soal
                      </p>
                    </div>
                    <Badge variant="outline">Mulai</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
