import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen">
      <SidebarNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
