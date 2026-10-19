import "server-only";
import { prisma } from "@/lib/db";

export type DailyPageViews = { date: string; count: number };
export type TopPath = { path: string; count: number };

/** Daily page-view counts for the last `days` days (oldest first), zero-filled. */
export async function getDailyPageViews(days = 14): Promise<DailyPageViews[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DailyPageViews[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export async function getTopPaths(limit = 10): Promise<TopPath[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["path"],
    _count: { _all: true },
    orderBy: { _count: { path: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({ path: g.path, count: g._count._all }));
}

export async function getAnalyticsSummary() {
  const [totalEvents, uniqueVisitorRows, loggedInVisitorRows] = await Promise.all([
    prisma.analyticsEvent.count(),
    prisma.analyticsEvent.findMany({ distinct: ["anonymousId"], select: { anonymousId: true } }),
    prisma.analyticsEvent.findMany({
      where: { userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  return {
    totalEvents,
    uniqueVisitors: uniqueVisitorRows.length,
    uniqueSignedInUsers: loggedInVisitorRows.length,
  };
}
