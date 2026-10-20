import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationSettingsForm } from "@/components/profil/notification-settings-form";
import { DeleteAccountButton } from "@/components/profil/delete-account-button";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/subscription/get-plan";
import { PAYMENTS_ENABLED } from "@/lib/config/features";
import {
  DAILY_STUDY_MINUTES_LABEL,
  LEARNING_GOAL_LABEL,
  SKILL_LABEL,
  TEST_TYPE_LABEL,
} from "@/lib/validation/onboarding";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Siswa",
  TEACHER: "Guru",
  ADMIN: "Admin",
};

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  // Not findUniqueOrThrow — a still-valid session whose user row is already
  // gone is a real, reachable state (e.g. a stale tab open to /profil after
  // the account was deleted from elsewhere), not an error to crash on.
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { profile: true, preference: true },
  });
  if (!user) {
    redirect("/");
  }

  const onboardingDone = Boolean(user.profile?.onboardingCompletedAt);
  const plan = await getUserPlan(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status email</span>
            <Badge variant={user.emailVerified ? "secondary" : "outline"}>
              {user.emailVerified ? "Terverifikasi" : "Belum diverifikasi"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peran</span>
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tujuan belajar</CardTitle>
          <CardDescription>
            {onboardingDone
              ? "Hasil onboarding Anda. Ubah kapan saja."
              : "Anda belum melengkapi onboarding."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {onboardingDone && user.profile ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tujuan</span>
                <span className="font-medium">
                  {user.profile.goal ? LEARNING_GOAL_LABEL[user.profile.goal] : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe tes</span>
                <span className="font-medium">
                  {user.profile.testType ? TEST_TYPE_LABEL[user.profile.testType] : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target overall band</span>
                <span className="font-medium">{user.profile.targetOverallBand ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skill tersulit</span>
                <span className="font-medium">
                  {user.profile.hardestSkill ? SKILL_LABEL[user.profile.hardestSkill] : "—"}
                </span>
              </div>
            </>
          ) : null}
          <Button
            render={
              <Link href="/onboarding">
                {onboardingDone ? "Perbarui tujuan belajar" : "Lengkapi onboarding"}
              </Link>
            }
            variant="outline"
            size="sm"
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi belajar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durasi belajar harian</span>
            <span className="font-medium">
              {user.preference ? DAILY_STUDY_MINUTES_LABEL[user.preference.dailyStudyMinutes] : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zona waktu</span>
            <span className="font-medium">{user.preference?.timezone ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi & Privasi</CardTitle>
          <CardDescription>
            Atur pengingat belajar dan apakah nama samaran Anda tampil di leaderboard XP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettingsForm
            initial={{
              reminderEnabled: user.preference?.reminderEnabled ?? false,
              reminderTime: user.preference?.reminderTime ?? null,
              reviewDueReminderEnabled: user.preference?.reviewDueReminderEnabled ?? true,
              streakRiskReminderEnabled: user.preference?.streakRiskReminderEnabled ?? true,
              leaderboardOptIn: user.preference?.leaderboardOptIn ?? false,
              leaderboardAlias: user.preference?.leaderboardAlias ?? null,
              analyticsOptOut: user.preference?.analyticsOptOut ?? false,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Saya</CardTitle>
          <CardDescription>
            Lihat{" "}
            <Link href="/privasi" className="text-brand-navy underline underline-offset-2">
              Kebijakan Privasi
            </Link>{" "}
            untuk detail lengkap data apa yang disimpan. Menghapus akun bersifat permanen dan tidak
            bisa dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Langganan</CardTitle>
          <CardDescription>
            Paket Anda saat ini:{" "}
            <Badge variant="secondary">{plan === "PREMIUM" ? "Premium" : "Gratis"}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {PAYMENTS_ENABLED ? (
            <p>Semua fitur belajar saat ini gratis. Pembelian paket belum tersedia di platform ini.</p>
          ) : (
            <p>
              Semua fitur belajar saat ini gratis untuk semua pengguna. Paket Premium (opsional)
              belum diaktifkan di platform ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
