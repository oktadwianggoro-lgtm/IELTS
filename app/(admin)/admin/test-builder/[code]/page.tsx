import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SectionManager } from "@/components/admin/section-manager";

export default async function EditMockTestPage({ params }: { params: Promise<{ code: string }> }) {
  await requireRole(["ADMIN", "TEACHER"]);
  const { code } = await params;

  const mockTest = await prisma.mockTest.findUnique({
    where: { code },
    include: {
      blueprint: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          listeningPassage: { select: { code: true, title: true } },
          readingPassage: { select: { code: true, title: true } },
        },
      },
    },
  });
  if (!mockTest) notFound();

  const availablePassages =
    mockTest.blueprint.skill === "LISTENING"
      ? await prisma.listeningPassage.findMany({
          where: { reviewStatus: "PUBLISHED" },
          select: { code: true, title: true },
        })
      : mockTest.blueprint.skill === "READING"
        ? await prisma.readingPassage.findMany({
            where: { reviewStatus: "PUBLISHED" },
            select: { code: true, title: true },
          })
        : [];

  const usedCodes = new Set(
    mockTest.sections.map((s) => s.listeningPassage?.code ?? s.readingPassage?.code),
  );
  const selectablePassages = availablePassages.filter((p) => !usedCodes.has(p.code));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {mockTest.title}
            <Badge variant="outline">{mockTest.blueprint.examType}</Badge>
            <Badge variant="outline">{mockTest.blueprint.skill}</Badge>
            <Badge variant="outline">
              {Math.round(mockTest.blueprint.totalSeconds / 60)} menit
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {mockTest.blueprint.description}
        </CardContent>
      </Card>

      <SectionManager
        mockTestCode={mockTest.code}
        sections={mockTest.sections.map((s) => ({
          id: s.id,
          order: s.order,
          title: s.listeningPassage?.title ?? s.readingPassage?.title ?? "—",
          code: s.listeningPassage?.code ?? s.readingPassage?.code ?? "—",
        }))}
        selectablePassages={selectablePassages}
      />
    </div>
  );
}
