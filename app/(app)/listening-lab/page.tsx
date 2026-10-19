import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { LISTENING_SECTION_LABEL, PEDAGOGICAL_LEVEL_LABEL } from "@/lib/content/labels";
import type { ListeningSection } from "@prisma/client";

const SECTION_ORDER: ListeningSection[] = ["SECTION_1", "SECTION_2", "SECTION_3", "SECTION_4"];

export default async function ListeningLabPage() {
  await requireUser();

  const passages = await prisma.listeningPassage.findMany({
    where: { reviewStatus: "PUBLISHED" },
    orderBy: [{ section: "asc" }, { title: "asc" }],
    include: { _count: { select: { questions: true } } },
  });

  const bySection = new Map<ListeningSection, typeof passages>();
  for (const p of passages) {
    const group = bySection.get(p.section) ?? [];
    group.push(p);
    bySection.set(p.section, group);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Listening Lab</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Latih Listening lewat audio asli dengan transkrip yang baru terbuka setelah Anda menjawab.
        </p>
      </div>

      {SECTION_ORDER.map((section) => {
        const items = bySection.get(section) ?? [];
        return (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{LISTENING_SECTION_LABEL[section]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Segera tersedia.</p>
              ) : (
                items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/listening-lab/${p.code}`}
                    className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {PEDAGOGICAL_LEVEL_LABEL[p.level]} · {p.accent} ·{" "}
                        {Math.round(p.durationSeconds / 60)} menit · {p._count.questions} soal
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
