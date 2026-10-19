import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Dalam Review",
  APPROVED: "Disetujui",
  PUBLISHED: "Diterbitkan",
  ARCHIVED: "Diarsipkan",
};

export default async function TestBuilderPage() {
  await requireRole(["ADMIN", "TEACHER"]);

  const mockTests = await prisma.mockTest.findMany({
    orderBy: { title: "asc" },
    include: { blueprint: true, _count: { select: { sections: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Builder
            <Button
              render={<Link href="/admin/test-builder/new">Buat Mock Test Baru</Link>}
              size="sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {mockTests.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada mock test.</p>
          ) : (
            mockTests.map((t) => (
              <Link
                key={t.id}
                href={`/admin/test-builder/${t.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {t.code} · {t.blueprint.examType} · {t.blueprint.skill} · {t._count.sections}{" "}
                    section
                  </p>
                </div>
                <Badge variant="outline">{STATUS_LABEL[t.reviewStatus] ?? t.reviewStatus}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
