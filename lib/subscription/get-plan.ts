import "server-only";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Real, computed-from-data plan lookup — not a hardcoded "everyone is
 * FREE" stub. A user has no Subscription row until a real subscription
 * happens (see schema comment), and an expired/canceled row also reads as
 * FREE, so this is already correct for when Fase 16's checkout flow is
 * eventually wired up — nothing here needs to change at that point.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, expiresAt: true },
  });

  if (!subscription) return "FREE";
  if (subscription.status !== "ACTIVE") return "FREE";
  if (subscription.expiresAt && subscription.expiresAt < new Date()) return "FREE";

  return subscription.plan;
}
