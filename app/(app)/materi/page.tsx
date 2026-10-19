import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

const MAIN_LEVEL_CODES = [
  "PATH-STARTER",
  "PATH-A1",
  "PATH-A2",
  "PATH-B1",
  "PATH-B2",
  "PATH-C1",
  "PATH-ENRICHMENT",
];

export default async function MateriCatalogPage() {
  const coursePaths = await prisma.coursePath.findMany({
    orderBy: { order: "asc" },
    include: {
      modules: {
        include: { _count: { select: { lessons: { where: { reviewStatus: "PUBLISHED" } } } } },
      },
      _count: { select: { modules: true } },
    },
  });

  const mainPaths = coursePaths.filter((p) => MAIN_LEVEL_CODES.includes(p.code));
  const specialPaths = coursePaths.filter((p) => !MAIN_LEVEL_CODES.includes(p.code));

  function publishedCount(path: (typeof coursePaths)[number]) {
    return path.modules.reduce((sum, m) => sum + m._count.lessons, 0);
  }

  function PathCard({ path }: { path: (typeof coursePaths)[number] }) {
    const available = publishedCount(path);
    return (
      <Link key={path.id} href={`/materi/${path.code}`}>
        <Card className="hover:border-brand-navy h-full transition-colors">
          <CardHeader>
            <CardTitle className="text-base">{path.title}</CardTitle>
            <CardDescription>{path.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="secondary">{path.modules.length} modul</Badge>
            {available > 0 ? (
              <Badge variant="outline">{available} lesson tersedia</Badge>
            ) : (
              <Badge variant="outline">Segera tersedia</Badge>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Jalur belajar berjenjang dari Starter/Pre-A1 hingga enrichment Band 7.5–9, plus jalur
          khusus Grammar, Vocabulary, Pronunciation, dan Strategi Tes.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Jalur Berjenjang
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mainPaths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Jalur Khusus
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {specialPaths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      </section>
    </div>
  );
}
