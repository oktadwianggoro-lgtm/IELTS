import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/lib/auth/sign-out";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Broad gate for the whole /admin area (ADMIN + TEACHER can both reach the
  // CMS). Individual pages impose stricter checks where needed — e.g. the
  // admin dashboard's user-role counts stay ADMIN-only.
  await requireRole(["ADMIN", "TEACHER"]);

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo href="/admin" />
          <span className="bg-brand-navy text-brand-navy-foreground rounded px-2 py-0.5 text-xs font-medium">
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
