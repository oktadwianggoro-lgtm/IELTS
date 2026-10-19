"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { allNavItems, mobilePrimaryHrefs, navGroups } from "@/lib/nav-config";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const primaryItems = mobilePrimaryHrefs
    .map((href) => allNavItems.find((item) => item.href === href))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const isMoreActive = !mobilePrimaryHrefs.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden"
      aria-label="Navigasi utama"
    >
      <ul className="grid grid-cols-5">
        {primaryItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-brand-navy" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="truncate px-1">{t.nav[item.key]}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium",
                isMoreActive ? "text-brand-navy" : "text-muted-foreground",
              )}
            >
              <Menu className="h-5 w-5" aria-hidden />
              <span>{t.nav.more}</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.nav.more}</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 px-4 pb-6">
                {navGroups
                  .flatMap((g) => g.items)
                  .filter((item) => !mobilePrimaryHrefs.includes(item.href))
                  .map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                          active && "border-brand-navy text-brand-navy",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{t.nav[item.key]}</span>
                      </Link>
                    );
                  })}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
