"use client";

import Link from "next/link";
import { BarChart3, Compass, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/layout/logo";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle label={t.common.language} />
          <ThemeToggle label={t.common.theme} />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Badge variant="secondary" className="mb-4">
            {t.landing.heroEyebrow}
          </Badge>
          <h1 className="text-foreground mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {t.landing.heroTitle}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base text-balance sm:text-lg">
            {t.landing.heroBody}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/dashboard">{t.landing.ctaPrimary}</Link>} size="lg" />
            <Button
              render={<Link href="/info-ielts">{t.landing.ctaSecondary}</Link>}
              size="lg"
              variant="outline"
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.landing.skillsTitle}
            </h2>
            <p className="text-muted-foreground mt-2">{t.landing.skillsBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.landing.skills.map((skill) => (
              <Card key={skill.title}>
                <CardHeader>
                  <CardTitle className="text-base">{skill.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{skill.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="bg-brand-teal/10 text-brand-teal flex h-10 w-10 items-center justify-center rounded-full">
                  <Compass className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-lg">{t.landing.pathTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{t.landing.pathBody}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="bg-brand-amber/10 text-brand-amber flex h-10 w-10 items-center justify-center rounded-full">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-lg">{t.landing.honestyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{t.landing.honestyBody}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <span className="bg-brand-navy/10 text-brand-navy mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </span>
          <Disclaimer className="mx-auto" />
        </section>
      </main>

      <footer className="border-border text-muted-foreground border-t px-4 py-6 text-center text-xs sm:px-6">
        © {new Date().getFullYear()} Success IELTS
      </footer>
    </div>
  );
}
