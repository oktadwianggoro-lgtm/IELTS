import "server-only";
import { prisma } from "@/lib/db";
import { sendMail, dailyReminderEmail } from "@/lib/email/mailer";
import { getUserStreak, hasActivityToday } from "./data";

export type DashboardNotification = { id: string; message: string; href?: string };

/** In-app banner messages, gated by the user's own preferences — "mudah
 * dimatikan" (Master Prompt §8.11). Never shows anything fictional: every
 * message is backed by a real count computed just above it. */
export async function getDashboardNotifications(userId: string): Promise<DashboardNotification[]> {
  const pref = await prisma.userPreference.findUnique({ where: { userId } });
  if (!pref) return [];

  const notifications: DashboardNotification[] = [];

  if (pref.reviewDueReminderEnabled) {
    const dueCount = await prisma.mistakeBookEntry.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    });
    if (dueCount > 0) {
      notifications.push({
        id: "review-due",
        message: `${dueCount} soal di Buku Kesalahan siap direview hari ini.`,
        href: "/buku-kesalahan",
      });
    }
  }

  if (pref.streakRiskReminderEnabled) {
    const [streak, activeToday] = await Promise.all([
      getUserStreak(userId),
      hasActivityToday(userId),
    ]);
    if (streak.currentStreakDays > 0 && !activeToday) {
      notifications.push({
        id: "streak-risk",
        message: `Streak ${streak.currentStreakDays} hari Anda akan putus jika belum belajar hari ini.`,
        href: "/latihan-harian",
      });
    }
  }

  return notifications;
}

/**
 * Sends a real reminder email via the existing mailer (works for real
 * when SMTP is configured, logs instead otherwise — see D-014) — but only
 * triggered by a dashboard visit, not a background scheduler, since no
 * job-queue/cron infrastructure exists in this app yet (D-039). Dedupes to
 * roughly once per day per user via `lastReminderSentAt`.
 */
export async function maybeSendDailyReminder(userId: string, userEmail: string): Promise<void> {
  const pref = await prisma.userPreference.findUnique({ where: { userId } });
  if (!pref?.reminderEnabled) return;

  const now = new Date();
  if (pref.lastReminderSentAt) {
    const hoursSinceLast = (now.getTime() - pref.lastReminderSentAt.getTime()) / 3_600_000;
    if (hoursSinceLast < 20) return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendMail({ to: userEmail, ...dailyReminderEmail(`${baseUrl}/dashboard`) });
  await prisma.userPreference.update({ where: { userId }, data: { lastReminderSentAt: now } });
}
