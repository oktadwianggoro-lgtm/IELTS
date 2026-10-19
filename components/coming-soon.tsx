"use client";

import Link from "next/link";
import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ComingSoon({ title, plannedPhase }: { title: string; plannedPhase?: string }) {
  const { t } = useLocale();

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <span className="bg-muted text-muted-foreground mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Construction className="h-6 w-6" aria-hidden />
          </span>
          <Badge variant="secondary">{t.common.comingSoonBadge}</Badge>
          <CardTitle className="mt-2 text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t.common.comingSoonBody}</p>
          {plannedPhase ? (
            <p className="text-muted-foreground text-xs">
              {t.common.comingSoonPlan}: <span className="font-medium">{plannedPhase}</span>
            </p>
          ) : null}
          <Button render={<Link href="/dashboard">{t.common.backToDashboard}</Link>} />
        </CardContent>
      </Card>
    </div>
  );
}
