import { NextResponse, type NextRequest } from "next/server";
import { recordPageView } from "@/lib/analytics/track";

/**
 * A dedicated Route Handler, not a Server Action, and specifically because
 * `/api/*` is excluded from proxy.ts's matcher — a Server Action posts to
 * the current PAGE route, which the matcher does NOT exclude, so every
 * navigation's tracking call was also passing through the session-wrapping
 * auth() proxy. That added an extra session touch on almost every page
 * transition, including the one right after sign-out — directly widening
 * D-036's already-documented sign-out/session-resurrection race window
 * (observed empirically: ~10% -> ~60% failure rate on auth.spec.ts's sign-out
 * test once the tracker was added). Keeping this off the proxy-wrapped path
 * removes that extra exposure. See D-042.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { path?: unknown; anonymousId?: unknown }
    | null;

  if (!body || typeof body.path !== "string" || typeof body.anonymousId !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await recordPageView(body.path, body.anonymousId, request.headers.get("dnt"));
  return NextResponse.json({ ok: true });
}
