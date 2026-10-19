"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export type NotificationSettingsInput = {
  reminderEnabled: boolean;
  reminderTime: string | null;
  reviewDueReminderEnabled: boolean;
  streakRiskReminderEnabled: boolean;
  leaderboardOptIn: boolean;
  leaderboardAlias: string | null;
  analyticsOptOut: boolean;
};

export async function updateNotificationSettingsAction(
  input: NotificationSettingsInput,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();

  if (input.leaderboardOptIn && !input.leaderboardAlias?.trim()) {
    return { error: "Nama samaran wajib diisi untuk ikut leaderboard." };
  }
  if (input.reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime)) {
    return { error: "Format waktu pengingat tidak valid." };
  }

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime,
      reviewDueReminderEnabled: input.reviewDueReminderEnabled,
      streakRiskReminderEnabled: input.streakRiskReminderEnabled,
      leaderboardOptIn: input.leaderboardOptIn,
      leaderboardAlias: input.leaderboardAlias?.trim() || null,
      analyticsOptOut: input.analyticsOptOut,
    },
    create: {
      userId: user.id,
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime,
      reviewDueReminderEnabled: input.reviewDueReminderEnabled,
      streakRiskReminderEnabled: input.streakRiskReminderEnabled,
      leaderboardOptIn: input.leaderboardOptIn,
      leaderboardAlias: input.leaderboardAlias?.trim() || null,
      analyticsOptOut: input.analyticsOptOut,
    },
  });

  revalidatePath("/profil");
  revalidatePath("/progress");
  return { ok: true };
}
