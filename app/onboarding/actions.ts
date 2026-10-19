"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { LOCALE_COOKIE } from "@/lib/i18n/dictionary";
import type { ActionState } from "../(auth)/actions";

function numberOrUndefined(value: FormDataEntryValue | null): number | undefined {
  if (!value || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    goal: formData.get("goal"),
    testType: formData.get("testType"),
    targetOverallBand: numberOrUndefined(formData.get("targetOverallBand")),
    targetListeningBand: numberOrUndefined(formData.get("targetListeningBand")),
    targetReadingBand: numberOrUndefined(formData.get("targetReadingBand")),
    targetWritingBand: numberOrUndefined(formData.get("targetWritingBand")),
    targetSpeakingBand: numberOrUndefined(formData.get("targetSpeakingBand")),
    testDate: formData.get("testDate") || undefined,
    hardestSkill: formData.get("hardestSkill") || undefined,
    dailyStudyMinutes: formData.get("dailyStudyMinutes"),
    timezone: formData.get("timezone"),
    interfaceLanguage: formData.get("interfaceLanguage"),
    reminderEnabled: formData.get("reminderEnabled") === "on",
    reminderTime: formData.get("reminderTime") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: user.id },
      data: {
        goal: data.goal,
        testType: data.testType,
        targetOverallBand: data.targetOverallBand,
        targetListeningBand: data.targetListeningBand,
        targetReadingBand: data.targetReadingBand,
        targetWritingBand: data.targetWritingBand,
        targetSpeakingBand: data.targetSpeakingBand,
        testDate: data.testDate ? new Date(data.testDate) : null,
        hardestSkill: data.hardestSkill,
        onboardingCompletedAt: new Date(),
      },
    }),
    prisma.userPreference.update({
      where: { userId: user.id },
      data: {
        dailyStudyMinutes: data.dailyStudyMinutes,
        timezone: data.timezone,
        interfaceLanguage: data.interfaceLanguage,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderEnabled ? (data.reminderTime ?? null) : null,
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, data.interfaceLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/dashboard");
}
