import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudyPlanItemRow } from "@/components/study-plan/study-plan-item-row";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SKILL_AREA_LABEL } from "@/lib/content/labels";

function formatDateHeading(date: Date, today: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default async function StudyPlanPage() {
  const user = await requireUser();

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: [{ scheduledDate: "asc" }, { order: "asc" }],
        include: { lesson: { include: { module: { include: { coursePath: true } } } } },
      },
    },
  });

  if (!plan || plan.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rencana Belajar</h1>
          <p className="text-muted-foreground mt-1 text-sm">Belum ada rencana belajar aktif.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buat rencana belajar Anda</CardTitle>
            <CardDescription>
              Rencana belajar dibuat otomatis berdasarkan hasil diagnostic test, target band, dan
              waktu belajar harian Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/mulai-dari-sini">Mulai dari Diagnostic Test</Link>} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date();
  const grouped = new Map<string, typeof plan.items>();
  for (const item of plan.items) {
    const key = item.scheduledDate.toISOString();
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  const doneCount = plan.items.filter((i) => i.status === "DONE").length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rencana Belajar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {doneCount} / {plan.items.length} lesson selesai dalam rencana ini.
        </p>
      </div>

      {Array.from(grouped.entries()).map(([dateKey, items]) => (
        <Card key={dateKey}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {formatDateHeading(items[0].scheduledDate, today)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <StudyPlanItemRow
                key={item.id}
                itemId={item.id}
                href={`/materi/${item.lesson.module.coursePath.code}/${item.lesson.module.code}/${item.lesson.code}`}
                title={item.lesson.title}
                skillLabel={SKILL_AREA_LABEL[item.lesson.skill]}
                estimatedMinutes={item.lesson.estimatedMinutes}
                reason={item.reason}
                status={item.status}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <Button
        render={<Link href="/mulai-dari-sini">Buat Ulang Rencana</Link>}
        variant="outline"
        className="w-full"
      />
    </div>
  );
}
