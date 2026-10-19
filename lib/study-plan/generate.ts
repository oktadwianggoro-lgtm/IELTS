import type { PedagogicalLevel, SkillArea } from "@prisma/client";

export type CandidateLesson = {
  id: string;
  level: PedagogicalLevel;
  skill: SkillArea;
  estimatedMinutes: number;
  order: number;
  prerequisiteLessonIds: string[];
};

export type StudyPlanItemDraft = {
  lessonId: string;
  order: number;
  scheduledDate: Date;
  reason: string;
};

export type GeneratePlanInput = {
  /** All published lessons, including already-completed ones (needed to
   * resolve prerequisites). */
  lessons: CandidateLesson[];
  completedLessonIds: Set<string>;
  /** Skills ordered weakest-first; empty if no diagnostic exists yet. */
  weakSkillsAscending: SkillArea[];
  estimatedLevel: PedagogicalLevel | null;
  dailyStudyMinutes: number;
  /** Inclusive start date for scheduling — pass explicitly for testability. */
  today: Date;
  /** Caps how many days the plan spans; derived from the test date upstream,
   * capped here too so a far-off exam doesn't generate a 300-day plan. */
  maxDays: number;
};

const LEVEL_ORDER: PedagogicalLevel[] = ["STARTER", "A1", "A2", "B1", "B2", "C1_ENRICHMENT"];

function levelIndex(level: PedagogicalLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Pure recommendation + scheduling algorithm (no DB access) so it's directly
 * unit-testable. Picks eligible not-yet-completed lessons (all prerequisites
 * done), ranks them by: weak-skill priority, then closeness to the learner's
 * estimated level (favouring at-level, then slightly-below for reinforcement,
 * then above), then catalog order — and greedily packs them into days within
 * the daily time budget.
 */
export function generateStudyPlan(input: GeneratePlanInput): StudyPlanItemDraft[] {
  const {
    lessons,
    completedLessonIds,
    weakSkillsAscending,
    estimatedLevel,
    dailyStudyMinutes,
    today,
    maxDays,
  } = input;

  const eligible = lessons.filter(
    (l) =>
      !completedLessonIds.has(l.id) &&
      l.prerequisiteLessonIds.every((p) => completedLessonIds.has(p)),
  );

  const weakRank = new Map(weakSkillsAscending.map((skill, i) => [skill, i]));
  const estIndex = estimatedLevel ? levelIndex(estimatedLevel) : null;

  function score(l: CandidateLesson): number {
    let s = 0;
    // Weaker skills score higher; the weakest skill gets the biggest boost.
    const rank = weakRank.get(l.skill);
    if (rank !== undefined) {
      s += (weakSkillsAscending.length - rank) * 10;
    }
    // Prefer lessons at or just below the learner's estimated level.
    if (estIndex !== null) {
      const diff = levelIndex(l.level) - estIndex;
      if (diff === 0) s += 6;
      else if (diff === -1)
        s += 3; // one level below: light reinforcement
      else if (diff > 0)
        s -= diff * 2; // above current level: lower priority
      else s -= 1; // more than one level below: mild deprioritisation
    }
    return s;
  }

  const ranked = [...eligible].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    if (levelIndex(a.level) !== levelIndex(b.level))
      return levelIndex(a.level) - levelIndex(b.level);
    return a.order - b.order;
  });

  function reasonFor(l: CandidateLesson): string {
    if (weakRank.has(l.skill)) return `Prioritas: area yang masih lemah (${l.skill})`;
    if (estIndex !== null && levelIndex(l.level) === estIndex) return "Sesuai level Anda saat ini";
    return "Lanjutan jalur belajar";
  }

  const items: StudyPlanItemDraft[] = [];
  let dayOffset = 0;
  let minutesUsedToday = 0;
  let order = 0;

  for (const lesson of ranked) {
    if (dayOffset >= maxDays) break;

    if (minutesUsedToday > 0 && minutesUsedToday + lesson.estimatedMinutes > dailyStudyMinutes) {
      dayOffset += 1;
      minutesUsedToday = 0;
      if (dayOffset >= maxDays) break;
    }

    items.push({
      lessonId: lesson.id,
      order,
      scheduledDate: addDays(today, dayOffset),
      reason: reasonFor(lesson),
    });
    minutesUsedToday += lesson.estimatedMinutes;
    order += 1;
  }

  return items;
}
