import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Konten" },
  { href: "/admin/review-queue", label: "Antrean Review" },
  { href: "/admin/test-builder", label: "Test Builder" },
  { href: "/admin/question-reports", label: "Laporan Soal" },
] as const;

const ADMIN_ONLY_NAV_ITEMS = [
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/audit-log", label: "Audit Log" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Broad gate for the whole /admin area (ADMIN + TEACHER can both reach the
  // CMS). Individual pages impose stricter checks where needed — e.g. the
  // admin dashboard's user-role counts, user management, and the audit log
  // stay ADMIN-only (Master Prompt §11: "guru tidak boleh otomatis
  // mendapat akses admin penuh").
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const navItems = user.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_ONLY_NAV_ITEMS] : NAV_ITEMS;

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
          <SignOutButton />
        </div>
      </header>
      <nav className="border-border bg-muted/30 flex flex-wrap gap-1 border-b px-4 py-2 sm:px-6">
        {navItems.map((item) => (
          <Button
            key={item.href}
            render={<Link href={item.href}>{item.label}</Link>}
            variant="ghost"
            size="sm"
          />
        ))}
      </nav>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
