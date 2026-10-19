import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, profile: { select: { onboardingCompletedAt: true, goal: true } } },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todayItems = await prisma.studyPlanItem.findMany({
    where: {
      studyPlan: { userId: sessionUser.id, isActive: true },
      scheduledDate: { gte: startOfToday, lt: startOfTomorrow },
    },
    orderBy: { order: "asc" },
    include: { lesson: { include: { module: { include: { coursePath: true } } } } },
  });

  return (
    <DashboardContent
      userName={user.name}
      onboardingCompleted={Boolean(user.profile?.onboardingCompletedAt)}
      todayPlanItems={todayItems.map((item) => ({
        id: item.id,
        title: item.lesson.title,
        status: item.status,
        href: `/materi/${item.lesson.module.coursePath.code}/${item.lesson.module.code}/${item.lesson.code}`,
      }))}
    />
  );
}
