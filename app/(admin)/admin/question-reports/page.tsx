import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { QuestionReportRow } from "@/components/admin/question-report-row";

export default async function AdminQuestionReportsPage() {
  await requireRole(["ADMIN", "TEACHER"]);

  const reports = await prisma.questionReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      reportedBy: { select: { name: true, email: true } },
      question: {
        select: {
          code: true,
          prompt: true,
          lesson: { select: { code: true } },
          listeningPassage: { select: { code: true } },
          readingPassage: { select: { code: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Soal Bermasalah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-sm">Tidak ada laporan terbuka saat ini.</p>
          ) : (
            reports.map((r) => (
              <QuestionReportRow
                key={r.id}
                report={{
                  id: r.id,
                  reason: r.reason,
                  details: r.details,
                  createdAt: r.createdAt,
                  reportedBy: r.reportedBy,
                  question: { code: r.question.code, prompt: r.question.prompt },
                  parentContentCode:
                    r.question.lesson?.code ??
                    r.question.listeningPassage?.code ??
                    r.question.readingPassage?.code ??
                    null,
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
