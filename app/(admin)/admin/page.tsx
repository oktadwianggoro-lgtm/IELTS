import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  // Stricter than the /admin layout gate (ADMIN + TEACHER): user-role counts
  // are ADMIN-only.
  await requireRole(["ADMIN"]);

  const [userCount, studentCount, teacherCount, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panel Admin</CardTitle>
          <CardDescription>
            Fondasi akses admin (Fase 1) dan CMS konten (Fase 2). Manajemen kelas, bank soal penuh,
            dan fitur admin lain akan dibangun pada Fase 13 sesuai Master Prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold">{userCount}</p>
            <p className="text-muted-foreground text-xs">Total pengguna</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{studentCount}</p>
            <p className="text-muted-foreground text-xs">Siswa</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{teacherCount}</p>
            <p className="text-muted-foreground text-xs">Guru</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{adminCount}</p>
            <p className="text-muted-foreground text-xs">Admin</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenCheck className="h-4 w-4" aria-hidden />
            Konten Kurikulum
          </CardTitle>
          <CardDescription>
            Tinjau, setujui, dan terbitkan lesson yang diimpor dari content/.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/admin/content">Buka CMS Konten</Link>}
            variant="outline"
            size="sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
