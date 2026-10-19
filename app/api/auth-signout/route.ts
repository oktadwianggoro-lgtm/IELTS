import { NextResponse } from "next/server";
import { signOut } from "@/auth";

/**
 * A Route Handler, not a Server Action — see lib/auth/sign-out.ts and
 * components/layout/sign-out-button.tsx for why. A Server Action posts to
 * the CURRENT page route (e.g. /dashboard), and Next.js auto-re-renders
 * that same route's Server Components as part of completing the action
 * (since this action never calls redirect()) — using the request's
 * original, still-authenticated cookies, in the SAME response as signOut()'s
 * own cookie-clearing. That produced two conflicting Set-Cookie instructions
 * in one response and resurrected the session (D-036, re-diagnosed in
 * Fase 15 — see D-042). A Route Handler has no such auto-rerender step.
 */
export async function POST() {
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
