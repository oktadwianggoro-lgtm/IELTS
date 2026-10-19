import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getUserStreak, getUserXp } from "@/lib/gamification/data";
import { evaluateAndAwardAchievements, getUserAchievements } from "@/lib/gamification/achievements";
import {
  getWeeklyAccuracy,
  getRecentActivity,
  getLastTestResult,
  getNextRecommendedLesson,
} from "@/lib/gamification/dashboard-data";
import { getDashboardNotifications, maybeSendDailyReminder } from "@/lib/gamification/reminders";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      profile: { select: { onboardingCompletedAt: true, goal: true } },
    },
  });
  const onboardingCompleted = Boolean(user.profile?.onboardingCompletedAt);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [todayItems, streak, xp] = await Promise.all([
    prisma.studyPlanItem.findMany({
      where: {
        studyPlan: { userId: sessionUser.id, isActive: true },
        scheduledDate: { gte: startOfToday, lt: startOfTomorrow },
      },
      orderBy: { order: "asc" },
      include: { lesson: { include: { module: { include: { coursePath: true } } } } },
    }),
    getUserStreak(sessionUser.id),
    getUserXp(sessionUser.id),
  ]);

  // Safe to run on every visit — idempotent (upsert, never re-awards or
  // revokes) and needs `streak` already computed above.
  await evaluateAndAwardAchievements(sessionUser.id, {
    onboardingCompleted,
    longestStreakDays: streak.longestStreakDays,
  });

  const [achievements, weeklyAccuracy, recentActivity, lastTestResult, nextLesson, notifications] =
    await Promise.all([
      getUserAchievements(sessionUser.id),
      getWeeklyAccuracy(sessionUser.id),
      getRecentActivity(sessionUser.id),
      getLastTestResult(sessionUser.id),
      getNextRecommendedLesson(sessionUser.id),
      getDashboardNotifications(sessionUser.id),
    ]);

  await maybeSendDailyReminder(sessionUser.id, user.email);

  return (
    <DashboardContent
      userName={user.name}
      onboardingCompleted={onboardingCompleted}
      todayPlanItems={todayItems.map((item) => ({
        id: item.id,
        title: item.lesson.title,
        status: item.status,
        href: `/materi/${item.lesson.module.coursePath.code}/${item.lesson.module.code}/${item.lesson.code}`,
      }))}
      streak={streak}
      xp={xp}
      achievements={achievements}
      weeklyAccuracy={weeklyAccuracy}
      recentActivity={recentActivity.map((a) => ({ ...a, at: a.at.toISOString() }))}
      lastTestResult={
        lastTestResult ? { ...lastTestResult, at: lastTestResult.at.toISOString() } : null
      }
      nextLesson={nextLesson}
      notifications={notifications}
    />
  );
}
