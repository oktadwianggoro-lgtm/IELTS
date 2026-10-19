"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "success-ielts-analytics-id";

function getAnonymousId(): string | null {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / blocked storage — skip tracking rather than throw.
    return null;
  }
}

/** Mounted once in the root layout; fires one event per client-side navigation. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const anonymousId = getAnonymousId();
    if (!anonymousId) return;
    // A plain fetch to a Route Handler, not a Server Action — see
    // app/api/analytics/track/route.ts for why (D-042). `keepalive` lets
    // this survive the hard navigation sign-out does right after.
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, anonymousId }),
      keepalive: true,
    }).catch(() => {
      // Best-effort only — a dropped beacon never affects the page.
    });
  }, [pathname]);

  return null;
}
