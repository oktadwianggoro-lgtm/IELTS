import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/lib/validation/onboarding";

const base = {
  goal: "STUDY_SCHOLARSHIP" as const,
  testType: "ACADEMIC" as const,
  dailyStudyMinutes: "TWENTY" as const,
  timezone: "Asia/Jakarta",
  interfaceLanguage: "ID" as const,
  reminderEnabled: false,
};

describe("onboardingSchema", () => {
  it("accepts the minimal required fields with everything optional omitted", () => {
    expect(onboardingSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a full submission with all optional fields", () => {
    const result = onboardingSchema.safeParse({
      ...base,
      targetOverallBand: 6.5,
      targetListeningBand: 7,
      testDate: "2026-12-01",
      hardestSkill: "WRITING",
      reminderEnabled: true,
      reminderTime: "19:30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a band score outside 1-9", () => {
    expect(onboardingSchema.safeParse({ ...base, targetOverallBand: 9.5 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, targetOverallBand: 0.5 }).success).toBe(false);
  });

  it("rejects a band score that isn't a multiple of 0.5", () => {
    expect(onboardingSchema.safeParse({ ...base, targetOverallBand: 6.3 }).success).toBe(false);
  });

  it("rejects an invalid reminder time format", () => {
    expect(onboardingSchema.safeParse({ ...base, reminderTime: "7:30pm" }).success).toBe(false);
  });

  it("rejects an invalid test date string", () => {
    expect(onboardingSchema.safeParse({ ...base, testDate: "not-a-date" }).success).toBe(false);
  });

  it("rejects an unknown enum value for goal", () => {
    expect(onboardingSchema.safeParse({ ...base, goal: "BECOME_RICH" }).success).toBe(false);
  });
});
