import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

/**
 * "Teacher review queue" (Master Prompt §11) — a single cross-type view
 * of everything sitting in IN_REVIEW, rather than making a reviewer hunt
 * through 6 separate content-type cards on /admin/content to find what
 * actually needs their attention right now.
 */
export default async function ReviewQueuePage() {
  await requireRole(["ADMIN", "TEACHER"]);

  const [lessons, listening, reading, writing, speaking, mockTests] = await Promise.all([
    prisma.lesson.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
    prisma.listeningPassage.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
    prisma.readingPassage.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
    prisma.writingTask.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
    prisma.speakingPrompt.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
    prisma.mockTest.findMany({
      where: { reviewStatus: "IN_REVIEW" },
      select: { code: true, title: true },
    }),
  ]);

  const items = [
    ...lessons.map((x) => ({ ...x, type: "Lesson" })),
    ...listening.map((x) => ({ ...x, type: "Listening Passage" })),
    ...reading.map((x) => ({ ...x, type: "Reading Passage" })),
    ...writing.map((x) => ({ ...x, type: "Writing Task" })),
    ...speaking.map((x) => ({ ...x, type: "Speaking Prompt" })),
    ...mockTests.map((x) => ({ ...x, type: "Mock Test" })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Antrean Review ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Tidak ada konten yang menunggu review saat ini.
            </p>
          ) : (
            items.map((item) => (
              <Link
                key={`${item.type}-${item.code}`}
                href={`/admin/content/${item.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.code}</p>
                </div>
                <Badge variant="outline">{item.type}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
