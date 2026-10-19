import Link from "next/link";
import { BookOpenCheck, ClipboardList, Flag, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  // Stricter than the /admin layout gate (ADMIN + TEACHER): user-role counts
  // are ADMIN-only.
  await requireRole(["ADMIN"]);

  const [userCount, studentCount, teacherCount, adminCount, openReportCount, inReviewCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.questionReport.count({ where: { status: "OPEN" } }),
      Promise.all([
        prisma.lesson.count({ where: { reviewStatus: "IN_REVIEW" } }),
        prisma.listeningPassage.count({ where: { reviewStatus: "IN_REVIEW" } }),
        prisma.readingPassage.count({ where: { reviewStatus: "IN_REVIEW" } }),
        prisma.writingTask.count({ where: { reviewStatus: "IN_REVIEW" } }),
        prisma.speakingPrompt.count({ where: { reviewStatus: "IN_REVIEW" } }),
        prisma.mockTest.count({ where: { reviewStatus: "IN_REVIEW" } }),
      ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
    ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panel Admin</CardTitle>
          <CardDescription>
            Manajemen kelas/penugasan belum dibangun (lihat D-040) — di luar itu, CMS konten, test
            builder, manajemen pengguna, laporan soal, dan audit log sudah tersedia.
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheck className="h-4 w-4" aria-hidden />
              Antrean Review
            </CardTitle>
            <CardDescription>{inReviewCount} konten menunggu review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/review-queue">Buka Antrean</Link>}
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4" aria-hidden />
              Laporan Soal
            </CardTitle>
            <CardDescription>{openReportCount} laporan terbuka.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/question-reports">Buka Laporan</Link>}
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" aria-hidden />
              Test Builder
            </CardTitle>
            <CardDescription>Susun blueprint dan section tryout.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/test-builder">Buka Test Builder</Link>}
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" aria-hidden />
              Pengguna
            </CardTitle>
            <CardDescription>Kelola peran STUDENT/TEACHER/ADMIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/users">Buka Pengguna</Link>}
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Audit Log
          </CardTitle>
          <CardDescription>Riwayat tindakan sensitif admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/admin/audit-log">Buka Audit Log</Link>}
            variant="outline"
            size="sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
