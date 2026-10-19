import Link from "next/link";
import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ coursePathCode: string; moduleCode: string }>;
}) {
  const { coursePathCode, moduleCode } = await params;

  const mod = await prisma.module.findUnique({
    where: { code: moduleCode },
    include: {
      coursePath: true,
      lessons: {
        where: { reviewStatus: "PUBLISHED" },
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });

  if (!mod || mod.coursePath.code !== coursePathCode) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <Button
          render={<Link href={`/materi/${coursePathCode}`}>Kembali ke {mod.coursePath.title}</Link>}
          variant="ghost"
          size="sm"
        />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{mod.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{mod.description}</p>
      </div>

      {mod.lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Construction className="text-muted-foreground h-8 w-8" aria-hidden />
            <p className="text-sm font-medium">Segera tersedia</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Lesson untuk modul ini belum diterbitkan. Konten ditambahkan secara bertahap mengikuti
              Fase 4 dan Fase 18 Master Prompt.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {mod.lessons.map((lesson, i) => (
            <Link key={lesson.id} href={`/materi/${coursePathCode}/${moduleCode}/${lesson.code}`}>
              <Card className="hover:border-brand-navy transition-colors">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {i + 1}. {lesson.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{lesson.estimatedMinutes} menit</Badge>
                    <Badge variant="outline">{lesson._count.questions} soal</Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
