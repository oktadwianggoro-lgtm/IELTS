import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

const SKILL_LABEL: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
  PRONUNCIATION: "Pronunciation",
  TEST_STRATEGY: "Test Strategy",
};

export default async function CoursePathPage({
  params,
}: {
  params: Promise<{ coursePathCode: string }>;
}) {
  const { coursePathCode } = await params;

  const coursePath = await prisma.coursePath.findUnique({
    where: { code: coursePathCode },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: { where: { reviewStatus: "PUBLISHED" } } } } },
      },
    },
  });

  if (!coursePath) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <Button render={<Link href="/materi">Kembali ke Materi</Link>} variant="ghost" size="sm" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{coursePath.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{coursePath.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {coursePath.modules.map((module) => (
          <Link key={module.id} href={`/materi/${coursePath.code}/${module.code}`}>
            <Card className="hover:border-brand-navy h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {SKILL_LABEL[module.skill] ?? module.skill}
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {module._count.lessons > 0 ? (
                  <Badge variant="outline">{module._count.lessons} lesson tersedia</Badge>
                ) : (
                  <Badge variant="outline">Segera tersedia</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
