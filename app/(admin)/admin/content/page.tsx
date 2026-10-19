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

  const [lessons, listeningPassages, readingPassages, writingTasks, speakingPrompts, mockTests] =
    await Promise.all([
      prisma.lesson.findMany({
        orderBy: [{ level: "asc" }, { order: "asc" }],
        include: {
          module: { include: { coursePath: true } },
          _count: { select: { questions: true } },
        },
      }),
      prisma.listeningPassage.findMany({
        orderBy: [{ section: "asc" }, { title: "asc" }],
        include: { _count: { select: { questions: true } } },
      }),
      prisma.readingPassage.findMany({
        orderBy: [{ examType: "asc" }, { title: "asc" }],
        include: { _count: { select: { questions: true } } },
      }),
      prisma.writingTask.findMany({
        orderBy: [{ taskType: "asc" }, { title: "asc" }],
      }),
      prisma.speakingPrompt.findMany({
        orderBy: [{ part: "asc" }, { title: "asc" }],
      }),
      prisma.mockTest.findMany({
        orderBy: [{ title: "asc" }],
        include: { blueprint: true, _count: { select: { sections: true } } },
      }),
    ]);

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

      <Card>
        <CardHeader>
          <CardTitle>Listening Passages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {listeningPassages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada listening passage.</p>
          ) : (
            listeningPassages.map((p) => (
              <Link
                key={p.id}
                href={`/admin/content/${p.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.code} · {p.section} · {p._count.questions} soal · v{p.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[p.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[p.reviewStatus] ?? p.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading Passages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {readingPassages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada reading passage.</p>
          ) : (
            readingPassages.map((p) => (
              <Link
                key={p.id}
                href={`/admin/content/${p.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.code} · {p.examType} · {p._count.questions} soal · v{p.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[p.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[p.reviewStatus] ?? p.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Writing Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {writingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada writing task.</p>
          ) : (
            writingTasks.map((t) => (
              <Link
                key={t.id}
                href={`/admin/content/${t.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {t.code} · {t.taskType} · v{t.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[t.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[t.reviewStatus] ?? t.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Speaking Prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {speakingPrompts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada speaking prompt.</p>
          ) : (
            speakingPrompts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/content/${p.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.code} · {p.part} · v{p.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[p.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[p.reviewStatus] ?? p.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mock Tests (Tryout)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {mockTests.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada mock test.</p>
          ) : (
            mockTests.map((t) => (
              <Link
                key={t.id}
                href={`/admin/content/${t.code}`}
                className="border-border hover:border-brand-navy flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {t.code} · {t.blueprint.examType} · {t.blueprint.skill} · {t._count.sections}{" "}
                    section · v{t.contentVersion}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[t.reviewStatus] ?? "outline"}>
                  {STATUS_LABEL[t.reviewStatus] ?? t.reviewStatus}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
