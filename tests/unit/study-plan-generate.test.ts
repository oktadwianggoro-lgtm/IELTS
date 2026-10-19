import { describe, expect, it } from "vitest";
import { generateStudyPlan, type CandidateLesson } from "@/lib/study-plan/generate";
import type { SkillArea } from "@prisma/client";

const TODAY = new Date("2026-10-20T00:00:00.000Z");

function lesson(overrides: Partial<CandidateLesson> & { id: string }): CandidateLesson {
  return {
    level: "STARTER",
    skill: "GRAMMAR",
    estimatedMinutes: 15,
    order: 0,
    prerequisiteLessonIds: [],
    ...overrides,
  };
}

const baseInput = {
  completedLessonIds: new Set<string>(),
  weakSkillsAscending: [] as SkillArea[],
  estimatedLevel: null,
  dailyStudyMinutes: 30,
  today: TODAY,
  maxDays: 14,
};

describe("generateStudyPlan", () => {
  it("returns an empty plan when there are no lessons", () => {
    expect(generateStudyPlan({ ...baseInput, lessons: [] })).toEqual([]);
  });

  it("excludes lessons whose prerequisites are not yet completed", () => {
    const lessons = [lesson({ id: "A" }), lesson({ id: "B", prerequisiteLessonIds: ["A"] })];
    const plan = generateStudyPlan({ ...baseInput, lessons, completedLessonIds: new Set() });
    const ids = plan.map((p) => p.lessonId);
    expect(ids).toContain("A");
    expect(ids).not.toContain("B");
  });

  it("includes a lesson once its prerequisite is completed", () => {
    const lessons = [lesson({ id: "A" }), lesson({ id: "B", prerequisiteLessonIds: ["A"] })];
    const plan = generateStudyPlan({
      ...baseInput,
      lessons,
      completedLessonIds: new Set(["A"]),
    });
    expect(plan.map((p) => p.lessonId)).toContain("B");
    expect(plan.map((p) => p.lessonId)).not.toContain("A"); // already completed
  });

  it("excludes already-completed lessons even with no prerequisites", () => {
    const lessons = [lesson({ id: "A" })];
    const plan = generateStudyPlan({ ...baseInput, lessons, completedLessonIds: new Set(["A"]) });
    expect(plan).toEqual([]);
  });

  it("prioritises lessons in weak skills over others", () => {
    const lessons = [
      lesson({ id: "strong-skill", skill: "READING", order: 0 }),
      lesson({ id: "weak-skill", skill: "WRITING", order: 1 }),
    ];
    const plan = generateStudyPlan({
      ...baseInput,
      lessons,
      weakSkillsAscending: ["WRITING"],
      dailyStudyMinutes: 1000, // avoid day-splitting interfering with order check
    });
    expect(plan[0].lessonId).toBe("weak-skill");
    expect(plan[0].reason).toMatch(/lemah/i);
  });

  it("prefers lessons at the learner's estimated level over ones far above it", () => {
    const lessons = [
      lesson({ id: "far-above", level: "C1_ENRICHMENT", order: 0 }),
      lesson({ id: "at-level", level: "A1", order: 1 }),
    ];
    const plan = generateStudyPlan({
      ...baseInput,
      lessons,
      estimatedLevel: "A1",
      dailyStudyMinutes: 1000,
    });
    expect(plan[0].lessonId).toBe("at-level");
  });

  it("packs lessons into a day until the daily minute budget is exceeded, then moves to the next day", () => {
    const lessons = [
      lesson({ id: "L1", estimatedMinutes: 15, order: 0 }),
      lesson({ id: "L2", estimatedMinutes: 15, order: 1 }),
      lesson({ id: "L3", estimatedMinutes: 15, order: 2 }),
    ];
    const plan = generateStudyPlan({ ...baseInput, lessons, dailyStudyMinutes: 30 });
    // L1 (15) + L2 (15) = 30, fits day 1. L3 would push to 45 > 30, so day 2.
    expect(plan[0].scheduledDate).toEqual(TODAY);
    expect(plan[1].scheduledDate).toEqual(TODAY);
    expect(plan[2].scheduledDate).toEqual(new Date("2026-10-21T00:00:00.000Z"));
  });

  it("always schedules at least one lesson per day even if it alone exceeds the daily budget", () => {
    const lessons = [lesson({ id: "long", estimatedMinutes: 60 })];
    const plan = generateStudyPlan({ ...baseInput, lessons, dailyStudyMinutes: 20 });
    expect(plan).toHaveLength(1);
    expect(plan[0].scheduledDate).toEqual(TODAY);
  });

  it("stops scheduling once maxDays is reached", () => {
    const lessons = Array.from(
      { length: 10 },
      (_, i) => lesson({ id: `L${i}`, estimatedMinutes: 100, order: i }), // 1 per day, forced
    );
    const plan = generateStudyPlan({ ...baseInput, lessons, dailyStudyMinutes: 10, maxDays: 3 });
    const distinctDays = new Set(plan.map((p) => p.scheduledDate.toISOString()));
    expect(distinctDays.size).toBeLessThanOrEqual(3);
  });

  it("keeps a stable, deterministic order for lessons with equal priority (by catalog order)", () => {
    const lessons = [lesson({ id: "second", order: 1 }), lesson({ id: "first", order: 0 })];
    const plan = generateStudyPlan({ ...baseInput, lessons, dailyStudyMinutes: 1000 });
    expect(plan.map((p) => p.lessonId)).toEqual(["first", "second"]);
  });
});
