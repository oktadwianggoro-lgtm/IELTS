import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
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
            Fondasi akses admin (Fase 1). CMS kurikulum, bank soal, dan manajemen kelas penuh akan
            dibangun pada Fase 13 sesuai Master Prompt.
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
    </div>
  );
}
