"use client";

import { Logo } from "@/components/layout/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { signOutAction } from "@/lib/auth/sign-out";
import { LogOut } from "lucide-react";

type HeaderUser = { name: string | null; email: string; image: string | null };

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.slice(0, 2).toUpperCase();
}

export function SiteHeader({ user }: { user?: HeaderUser }) {
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
        {user ? (
          <div className="ml-1 flex items-center gap-2">
            <Avatar size="sm">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
              {user.name ?? user.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Keluar" title="Keluar">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
