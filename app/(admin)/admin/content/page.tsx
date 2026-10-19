import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "default"> = {
  DRAFT: "outline",
  IN_REVIEW: "secondary",
  APPROVED: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Dalam Review",
  APPROVED: "Disetujui",
  PUBLISHED: "Diterbitkan",
  ARCHIVED: "Diarsipkan",
};

export default async function AdminContentListPage() {
  await requireRole(["ADMIN", "TEACHER"]);

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ level: "asc" }, { order: "asc" }],
    include: {
      module: { include: { coursePath: true } },
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Konten Kurikulum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {lessons.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada lesson. Jalankan <code>npm run content:import</code> untuk mengimpor dari{" "}
              <code>content/</code>.
            </p>
          ) : (
            lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/admin/content/${lesson.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {lesson.code} · {lesson.module.coursePath.title} / {lesson.module.title} ·{" "}
                    {lesson._count.questions} soal · v{lesson.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[lesson.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[lesson.reviewStatus] ?? lesson.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
