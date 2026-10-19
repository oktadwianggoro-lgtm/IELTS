import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/lib/auth/sign-out";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo href="/admin" />
          <span className="rounded bg-brand-navy px-2 py-0.5 text-xs font-medium text-brand-navy-foreground">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/dashboard">Area siswa</Link>} variant="ghost" size="sm" />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
