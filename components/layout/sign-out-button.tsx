"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Two deliberate choices here, both fixing real, reproduced session-
 * resurrection races (D-036, D-042):
 *
 * 1. Sign-out is a `fetch` to a Route Handler (app/api/auth-signout), not a
 *    Server Action. A Server Action posts to the CURRENT page route (e.g.
 *    /dashboard) and Next.js auto-re-renders that route's Server Components
 *    as part of completing the action, using the request's original,
 *    still-authenticated cookies — in the SAME response as signOut()'s own
 *    cookie-clearing. That produced two conflicting Set-Cookie instructions
 *    in one response and resurrected the session. A Route Handler has no
 *    such auto-rerender step.
 * 2. A hard navigation (`window.location.href`), not a soft client-router
 *    redirect, afterward: a soft redirect leaves any in-flight authenticated
 *    requests — e.g. the sidebar's own <Link> prefetches — alive, and those
 *    can also re-issue a session cookie that lands after sign-out's clear.
 *    A hard navigation makes the browser abort those in-flight requests.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await fetch("/api/auth-signout", { method: "POST" });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation, see comment above
      window.location.href = "/";
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Keluar"
      title="Keluar"
      onClick={handleSignOut}
      disabled={pending}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
