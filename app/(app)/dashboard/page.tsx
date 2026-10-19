import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, profile: { select: { onboardingCompletedAt: true, goal: true } } },
  });

  return (
    <DashboardContent
      userName={user.name}
      onboardingCompleted={Boolean(user.profile?.onboardingCompletedAt)}
    />
  );
}
