import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, SPEAKING_PART_LABEL } from "@/lib/content/labels";
import type { SpeakingPart } from "@prisma/client";

const PART_ORDER: SpeakingPart[] = ["PART1", "PART2", "PART3"];

export default async function SpeakingLabPage() {
  const user = await requireUser();

  const [prompts, submissionCounts] = await Promise.all([
    prisma.speakingPrompt.findMany({
      where: { reviewStatus: "PUBLISHED" },
      orderBy: [{ part: "asc" }, { title: "asc" }],
    }),
    prisma.speakingSubmission.groupBy({
      by: ["speakingPromptId"],
      where: { userId: user.id, status: "COMPLETED" },
      _count: { _all: true },
    }),
  ]);

  const completedCountByPromptId = new Map(
    submissionCounts.map((s) => [s.speakingPromptId, s._count._all]),
  );

  const byPart = new Map<SpeakingPart, typeof prompts>();
  for (const p of prompts) {
    const group = byPart.get(p.part) ?? [];
    group.push(p);
    byPart.set(p.part, group);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Speaking Lab</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Latih Part 1, 2, dan 3 dengan timer persiapan/bicara, rekaman opsional, self-assessment,
          dan contoh jawaban berbasis 4 kriteria IELTS Speaking.
        </p>
      </div>

      {PART_ORDER.map((part) => {
        const items = byPart.get(part) ?? [];
        return (
          <Card key={part}>
            <CardHeader>
              <CardTitle className="text-base">{SPEAKING_PART_LABEL[part]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Segera tersedia.</p>
              ) : (
                items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/speaking-lab/${p.code}`}
                    className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {PEDAGOGICAL_LEVEL_LABEL[p.level]} · {p.responseSeconds}s bicara
                        {(completedCountByPromptId.get(p.id) ?? 0) > 0
                          ? ` · ${completedCountByPromptId.get(p.id)}x dikerjakan`
                          : ""}
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
