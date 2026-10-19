"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "en", label: "EN" },
];

export function LanguageToggle({ label }: { label: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={label}
      className="border-border bg-background inline-flex items-center rounded-md border p-0.5 text-xs font-medium"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
          className={cn(
            "rounded-sm px-2 py-1 transition-colors",
            locale === option.value
              ? "bg-brand-navy text-brand-navy-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
