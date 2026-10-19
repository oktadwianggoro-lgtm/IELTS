"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailWarning, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/app/(auth)/actions";
import type { ActionState } from "@/app/(auth)/actions";

export function AccountBanners({
  emailVerified,
  onboardingCompleted,
}: {
  emailVerified: boolean;
  onboardingCompleted: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async () => resendVerificationAction(),
    null,
  );

  if (emailVerified && onboardingCompleted) return null;

  return (
    <div className="space-y-2 border-b border-border bg-muted/40 px-4 py-2 sm:px-6">
      {!emailVerified ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MailWarning className="h-4 w-4 shrink-0" aria-hidden />
            Email Anda belum diverifikasi.
            {state?.success ? " Email verifikasi baru telah dikirim." : null}
          </span>
          <form action={formAction}>
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Mengirim..." : "Kirim ulang email verifikasi"}
            </Button>
          </form>
        </div>
      ) : null}
      {!onboardingCompleted ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Compass className="h-4 w-4 shrink-0" aria-hidden />
            Lengkapi tujuan belajar Anda agar rekomendasi lebih akurat.
          </span>
          <Button
            render={<Link href="/onboarding">Lengkapi sekarang</Link>}
            size="sm"
            variant="outline"
          />
        </div>
      ) : null}
    </div>
  );
}
