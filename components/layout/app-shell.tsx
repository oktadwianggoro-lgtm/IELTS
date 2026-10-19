import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountBanners } from "@/components/layout/account-banners";

type HeaderUser = { name: string | null; email: string; image: string | null };

export function AppShell({
  children,
  user,
  emailVerified,
  onboardingCompleted,
}: {
  children: React.ReactNode;
  user: HeaderUser;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}) {
  return (
    <div className="bg-background flex min-h-screen">
      <SidebarNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <SiteHeader user={user} />
        <AccountBanners emailVerified={emailVerified} onboardingCompleted={onboardingCompleted} />
        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
