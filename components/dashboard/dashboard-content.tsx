"use client";

import Link from "next/link";
import { Activity, CalendarDays, CheckCircle2, Compass, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

export function DashboardContent({
  userName,
  onboardingCompleted,
}: {
  userName: string | null;
  onboardingCompleted: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
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
                  ? "Diagnostic test dan rencana belajar personal akan dibangun pada Fase 5."
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
            <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.todayPlanTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.dashboard.todayPlanEmpty}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <TrendingUp className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.progressTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.dashboard.progressEmpty}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="text-muted-foreground h-4 w-4" aria-hidden />
            <CardTitle className="text-sm font-medium">{t.dashboard.activityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.dashboard.activityEmpty}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
