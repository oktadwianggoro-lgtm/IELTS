import { z } from "zod";

export const learningGoalValues = [
  "STUDY_SCHOLARSHIP",
  "WORK",
  "MIGRATION",
  "PERSONAL_DEVELOPMENT",
] as const;

export const testTypeValues = ["ACADEMIC", "GENERAL_TRAINING", "UNDECIDED"] as const;

export const skillNameValues = ["LISTENING", "READING", "WRITING", "SPEAKING"] as const;

export const dailyStudyMinutesValues = [
  "TEN",
  "TWENTY",
  "THIRTY",
  "FORTY_FIVE",
  "SIXTY_PLUS",
] as const;

export const interfaceLanguageValues = ["ID", "EN"] as const;

const bandScore = z
  .number()
  .min(1, "Band minimal 1.0")
  .max(9, "Band maksimal 9.0")
  .multipleOf(0.5, "Band harus kelipatan 0.5");

export const onboardingSchema = z.object({
  goal: z.enum(learningGoalValues),
  testType: z.enum(testTypeValues),
  targetOverallBand: bandScore.optional(),
  targetListeningBand: bandScore.optional(),
  targetReadingBand: bandScore.optional(),
  targetWritingBand: bandScore.optional(),
  targetSpeakingBand: bandScore.optional(),
  testDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Tanggal tidak valid"),
  hardestSkill: z.enum(skillNameValues).optional(),
  dailyStudyMinutes: z.enum(dailyStudyMinutesValues),
  timezone: z.string().min(1).max(100),
  interfaceLanguage: z.enum(interfaceLanguageValues),
  reminderEnabled: z.boolean(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu HH:mm")
    .optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const DAILY_STUDY_MINUTES_LABEL: Record<(typeof dailyStudyMinutesValues)[number], string> = {
  TEN: "10 menit",
  TWENTY: "20 menit",
  THIRTY: "30 menit",
  FORTY_FIVE: "45 menit",
  SIXTY_PLUS: "60+ menit",
};

export const LEARNING_GOAL_LABEL: Record<(typeof learningGoalValues)[number], string> = {
  STUDY_SCHOLARSHIP: "Studi / Beasiswa",
  WORK: "Pekerjaan / Profesi",
  MIGRATION: "Migrasi",
  PERSONAL_DEVELOPMENT: "Pengembangan Diri",
};

export const TEST_TYPE_LABEL: Record<(typeof testTypeValues)[number], string> = {
  ACADEMIC: "Academic",
  GENERAL_TRAINING: "General Training",
  UNDECIDED: "Belum tahu",
};

export const SKILL_LABEL: Record<(typeof skillNameValues)[number], string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};
