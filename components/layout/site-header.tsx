"use client";

import { Logo } from "@/components/layout/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocale } from "@/lib/i18n/locale-provider";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur sm:px-6">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        <LanguageToggle label={t.common.language} />
        <ThemeToggle label={t.common.theme} />
      </div>
    </header>
  );
}
