import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      profile: { select: { onboardingCompletedAt: true } },
    },
  });

  // The session is valid but the user row is gone (e.g. deleted account);
  // middleware already guarantees auth, so this should be unreachable.
  if (!user) {
    return null;
  }

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image }}
      emailVerified={Boolean(user.emailVerified)}
      onboardingCompleted={Boolean(user.profile?.onboardingCompletedAt)}
    >
      {children}
    </AppShell>
  );
}
