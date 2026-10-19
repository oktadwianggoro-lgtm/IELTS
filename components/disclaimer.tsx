"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  const { t } = useLocale();

  return (
    <p className={cn("text-muted-foreground text-xs leading-relaxed", className)}>{t.disclaimer}</p>
  );
}
