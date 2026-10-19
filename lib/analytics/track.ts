import "server-only";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

/**
 * Records one page-view event. First-party only — no third-party script,
 * no IP address or user agent stored. `anonymousId` is generated and kept
 * client-side in localStorage (see components/analytics/page-view-tracker.tsx),
 * never a cookie, so it never crosses origins and carries nothing that
 * identifies the person beyond "same browser visited more than once".
 *
 * Two independent opt-outs are honored before anything is written: the
 * `DNT: 1` request header, and (for signed-in users only, since an
 * anonymous visitor has no account to store the preference on)
 * `UserPreference.analyticsOptOut` — see /privasi for what this discloses.
 *
 * Called from app/api/analytics/track/route.ts, a plain Route Handler —
 * deliberately NOT a Server Action — see that file for why (D-042).
 */
export async function recordPageView(path: string, anonymousId: string, dntHeader: string | null) {
  if (!anonymousId || typeof path !== "string" || path.length === 0) {
    return;
  }

  if (dntHeader === "1") {
    return;
  }

  const session = await getSession();
  if (session?.user) {
    const preference = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { analyticsOptOut: true },
    });
    if (preference?.analyticsOptOut) {
      return;
    }
  }

  await prisma.analyticsEvent.create({
    data: {
      anonymousId,
      userId: session?.user?.id,
      eventName: "page_view",
      path,
    },
  });
}
