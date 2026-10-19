import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { getUserStreak, getUserXp } from "@/lib/gamification/data";
import { getUserAchievements } from "@/lib/gamification/achievements";
import { getSkillProgress, getLeaderboard } from "@/lib/gamification/progress";
import { getWeeklyAccuracy } from "@/lib/gamification/dashboard-data";
import { SKILL_AREA_LABEL } from "@/lib/content/labels";
import { ProgressCharts } from "@/components/dashboard/progress-charts";

export default async function ProgressPage() {
  const sessionUser = await requireUser();
  const preference = await prisma.userPreference.findUnique({ where: { userId: sessionUser.id } });

  const [streak, xp, achievements, skillProgress, weeklyAccuracy, leaderboard] = await Promise.all([
    getUserStreak(sessionUser.id),
    getUserXp(sessionUser.id),
    getUserAchievements(sessionUser.id),
    getSkillProgress(sessionUser.id),
    getWeeklyAccuracy(sessionUser.id, 12),
    getLeaderboard(sessionUser.id),
  ]);

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress & Laporan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan belajar berdasarkan aktivitas Anda yang sesungguhnya — estimasi untuk motivasi,
          bukan skor resmi IELTS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Level {xp.level}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{xp.xp} XP</p>
            <p className="text-muted-foreground text-xs">
              {xp.current} / {xp.needed} menuju level {xp.level + 1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{streak.currentStreakDays} hari</p>
            <p className="text-muted-foreground text-xs">Rekor: {streak.longestStreakDays} hari</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pencapaian</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {earnedCount} / {achievements.length}
            </p>
            <p className="text-muted-foreground text-xs">badge diraih</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress per Skill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skillProgress.map((s) => (
            <div key={s.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{SKILL_AREA_LABEL[s.skill]}</span>
                <span className="text-muted-foreground">
                  {s.accuracyPct !== null
                    ? `${s.accuracyPct}% (${s.correct}/${s.total})`
                    : "Belum ada data"}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div className="bg-brand-teal h-full" style={{ width: `${s.accuracyPct ?? 0}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ProgressCharts weeklyAccuracy={weeklyAccuracy} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Pencapaian</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.code}
              className={`rounded-md border p-3 text-center text-sm ${a.earned ? "border-brand-teal bg-brand-teal/10" : "border-border opacity-50"}`}
            >
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{a.description}</p>
              {a.earned && a.earnedAt ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(a.earnedAt).toLocaleDateString("id-ID")}
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard (Opsional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!preference?.leaderboardOptIn ? (
            <p className="text-muted-foreground text-sm">
              Anda belum ikut leaderboard. Aktifkan dengan nama samaran di{" "}
              <Link href="/profil" className="underline">
                Profil & Langganan
              </Link>
              .
            </p>
          ) : null}
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada peserta leaderboard.</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {leaderboard.map((entry, i) => (
                <li
                  key={`${entry.alias}-${i}`}
                  className={`flex justify-between rounded px-2 py-1 ${entry.isCurrentUser ? "bg-brand-navy/10 font-medium" : ""}`}
                >
                  <span>
                    {i + 1}. {entry.alias}
                    {entry.isCurrentUser ? (
                      <Badge className="ml-2" variant="outline">
                        Anda
                      </Badge>
                    ) : null}
                  </span>
                  <span>{entry.xp} XP</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
