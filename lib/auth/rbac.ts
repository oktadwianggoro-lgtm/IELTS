import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

/** Redirects to /login (with callbackUrl) if not authenticated. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Redirects to /login if not authenticated, or to /dashboard if authenticated
 * but not one of `roles`. Use at the top of a page/layout, not inside a
 * try/catch — redirect() throws by design.
 */
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
