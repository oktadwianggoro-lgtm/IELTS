"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/sign-out";

/**
 * A soft (client-router) redirect after sign-out leaves any in-flight
 * authenticated requests — e.g. the sidebar's own <Link> prefetches —
 * alive. Those requests re-read the still-valid pre-signout session and
 * can re-issue a session cookie that lands after sign-out's own
 * cookie-clearing response, resurrecting the session (D-035). A hard
 * navigation makes the browser abort those in-flight requests instead.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
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
