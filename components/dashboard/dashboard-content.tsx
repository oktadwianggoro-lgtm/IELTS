"use client";

import Link from "next/link";
import {
  Activity,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Flame,
  ListChecks,
  type LucideIcon,
  Mic,
  PenSquare,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Compass,
  ClipboardCheck,
  Flame,
  ListChecks,
  PenSquare,
  Mic,
  ClipboardList,
};

export type TodayPlanItem = {
  id: string;
  title: string;
  status: "PENDING" | "DONE" | "SKIPPED";
  href: string;
};

export type DashboardAchievement = {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: Date | null;
};

export type DashboardActivityItem = {
  id: string;
  type: "lesson" | "practice" | "writing" | "speaking" | "tryout";
  label: string;
  href: string;
  at: string;
};

export type DashboardLastTestResult =
  | { kind: "diagnostic"; level: string | null; at: string; href: string }
  | {
      kind: "tryout";
      title: string;
      band: number | null;
      rawScore: number;
      maxRawScore: number;
      at: string;
      href: string;
    }
  | null;

const chartConfig = {
  accuracyPct: { label: "Akurasi (%)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function DashboardContent({
  userName,
  onboardingCompleted,
  todayPlanItems,
  streak,
  xp,
  achievements,
  weeklyAccuracy,
  recentActivity,
  lastTestResult,
  nextLesson,
  notifications,
}: {
  userName: string | null;
  onboardingCompleted: boolean;
  todayPlanItems: TodayPlanItem[];
  streak: { currentStreakDays: number; longestStreakDays: number };
  xp: { xp: number; level: number; current: number; needed: number };
  achievements: DashboardAchievement[];
  weeklyAccuracy: { week: string; accuracyPct: number; total: number }[];
  recentActivity: DashboardActivityItem[];
  lastTestResult: DashboardLastTestResult;
  nextLesson: { title: string; href: string } | null;
  notifications: { id: string; message: string; href?: string }[];
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="border-brand-amber/30 bg-brand-amber/10 flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <BellRing className="text-brand-amber h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{n.message}</span>
              {n.href ? (
                <Link href={n.href} className="font-medium hover:underline">
                  Lihat
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <Card className="border-brand-navy/20 bg-brand-navy/5">
        <CardHeader>
          <CardTitle className="text-xl">
            {userName ? `Halo, ${userName}!` : t.dashboard.welcomeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t.dashboard.welcomeBody}</p>
          <div className="border-border bg-card flex items-start gap-3 rounded-md border p-4">
            {onboardingCompleted ? (
              <CheckCircle2 className="text-brand-teal mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <Compass className="text-brand-teal mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium">
                {onboardingCompleted ? "Onboarding selesai" : t.dashboard.nextStepTitle}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {onboardingCompleted
                  ? "Kerjakan diagnostic test untuk mendapat rencana belajar personal."
                  : t.dashboard.nextStepBody}
              </p>
            </div>
          </div>
          <Button
            render={
              <Link href={onboardingCompleted ? "/mulai-dari-sini" : "/onboarding"}>
                {onboardingCompleted ? t.common.learnMore : "Lengkapi onboarding"}
              </Link>
            }
            variant="outline"
            size="sm"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Flame
              className={cn(
                "h-4 w-4",
                streak.currentStreakDays > 0 ? "text-brand-amber" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <CardTitle className="text-sm font-medium">Streak Belajar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{streak.currentStreakDays} hari</p>
            <p className="text-muted-foreground text-xs">
              Rekor terpanjang: {streak.longestStreakDays} hari
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Trophy className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">Level {xp.level}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand-teal h-full"
                style={{ width: `${Math.min(100, Math.round((xp.current / xp.needed) * 100))}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {xp.current} / {xp.needed} XP menuju level {xp.level + 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.todayPlanTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayPlanItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.dashboard.todayPlanEmpty}</p>
            ) : (
              <ul className="space-y-1.5">
                {todayPlanItems.map((item) => (
                  <li key={item.id} className="text-sm">
                    <Link
                      href={item.href}
                      className={
                        item.status === "DONE"
                          ? "text-muted-foreground line-through"
                          : "hover:underline"
                      }
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <TrendingUp className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.progressTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyAccuracy.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.dashboard.progressEmpty}</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[180px] w-full">
                <BarChart data={weeklyAccuracy}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="accuracyPct"
                    fill="var(--color-accuracyPct)"
                    radius={4}
                    minPointSize={3}
                  />
                </BarChart>
              </ChartContainer>
            )}
            <p className="text-muted-foreground mt-2 text-xs">
              Estimasi akurasi mingguan dari soal latihan — bukan skor resmi IELTS.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.activityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.dashboard.activityEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((item) => (
                  <li key={item.id} className="text-sm">
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {new Date(item.at).toLocaleDateString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pencapaian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Trophy;
              return (
                <div
                  key={a.code}
                  title={a.description}
                  className={cn(
                    "flex w-24 flex-col items-center gap-1 rounded-md border p-2 text-center",
                    a.earned ? "border-brand-teal bg-brand-teal/10" : "border-border opacity-40",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      a.earned ? "text-brand-teal" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <p className="text-xs font-medium">{a.title}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {lastTestResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Hasil Tes Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {lastTestResult.kind === "diagnostic" ? (
                <p>Diagnostic test — estimasi level: {lastTestResult.level ?? "—"}</p>
              ) : (
                <p>
                  {lastTestResult.title} — {lastTestResult.rawScore}/{lastTestResult.maxRawScore}
                  {lastTestResult.band !== null ? `, estimasi band ${lastTestResult.band}` : ""}
                </p>
              )}
              <Link href={lastTestResult.href} className="text-xs hover:underline">
                Lihat detail
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {nextLesson ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Belajar Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{nextLesson.title}</p>
              <Link href={nextLesson.href} className="text-xs hover:underline">
                Mulai lesson ini
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
