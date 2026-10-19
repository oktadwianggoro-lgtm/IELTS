import { describe, expect, it } from "vitest";
import type { SkillArea } from "@prisma/client";
import { generatePracticeSet, type PracticeCandidate } from "@/lib/practice/generate-set";

function q(
  questionId: string,
  skill: SkillArea,
  lessonId: string | null = null,
): PracticeCandidate {
  return { questionId, skill, lessonId };
}

describe("generatePracticeSet", () => {
  it("returns an empty set for no candidates or a non-positive size", () => {
    expect(
      generatePracticeSet({
        candidates: [],
        weakSkillsAscending: [],
        recentLessonIds: new Set(),
        dueReviewQuestionIds: new Set(),
        size: 10,
      }),
    ).toEqual([]);
    expect(
      generatePracticeSet({
        candidates: [q("Q1", "GRAMMAR")],
        weakSkillsAscending: [],
        recentLessonIds: new Set(),
        dueReviewQuestionIds: new Set(),
        size: 0,
      }),
    ).toEqual([]);
  });

  it("prioritizes due reviews, then weak skills, then recent lessons by default weights", () => {
    const candidates = [
      q("R1", "LISTENING"),
      q("R2", "LISTENING"),
      q("W1", "GRAMMAR"),
      q("W2", "GRAMMAR"),
      q("W3", "GRAMMAR"),
      q("W4", "GRAMMAR"),
      q("W5", "GRAMMAR"),
      q("N1", "WRITING", "LESSON-1"),
      q("N2", "WRITING", "LESSON-1"),
      q("N3", "WRITING", "LESSON-1"),
    ];
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR"],
      recentLessonIds: new Set(["LESSON-1"]),
      dueReviewQuestionIds: new Set(["R1", "R2"]),
      size: 10,
    });
    const ids = result.map((r) => r.questionId);
    expect(ids).toHaveLength(10);
    // 20% review = 2, 50% weak = 5, 30% recent = 3.
    expect(ids.filter((id) => id.startsWith("R"))).toHaveLength(2);
    expect(ids.filter((id) => id.startsWith("W"))).toHaveLength(5);
    expect(ids.filter((id) => id.startsWith("N"))).toHaveLength(3);
  });

  it("never returns duplicate questions when a question matches multiple buckets", () => {
    const candidates = [q("OVERLAP", "GRAMMAR", "LESSON-1"), q("W2", "GRAMMAR")];
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR"],
      recentLessonIds: new Set(["LESSON-1"]),
      dueReviewQuestionIds: new Set(["OVERLAP"]),
      size: 10,
    });
    const ids = result.map((r) => r.questionId);
    expect(ids).toEqual(["OVERLAP", "W2"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("backfills from the general pool when a bucket is thinner than its target", () => {
    const candidates = [q("W1", "GRAMMAR"), q("OTHER1", "SPEAKING"), q("OTHER2", "VOCABULARY")];
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR"],
      recentLessonIds: new Set(),
      dueReviewQuestionIds: new Set(),
      size: 3,
    });
    // weak target = round(3*0.5) = 2, but only 1 GRAMMAR question exists —
    // the shortfall is filled from the general pool instead of returning <3.
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.questionId).sort()).toEqual(["OTHER1", "OTHER2", "W1"]);
  });

  it("orders weak-skill picks by skill rank (weakest skill's questions first)", () => {
    const candidates = [
      q("A", "SPEAKING"),
      q("B", "GRAMMAR"),
      q("C", "SPEAKING"),
      q("D", "GRAMMAR"),
    ];
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR", "SPEAKING"],
      recentLessonIds: new Set(),
      dueReviewQuestionIds: new Set(),
      size: 4,
      weights: { weak: 1, recent: 0, review: 0 },
    });
    expect(result.map((r) => r.questionId)).toEqual(["B", "D", "A", "C"]);
  });

  it("respects a custom weights override", () => {
    const candidates = [q("R1", "LISTENING"), q("W1", "GRAMMAR"), q("N1", "WRITING", "L1")];
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR"],
      recentLessonIds: new Set(["L1"]),
      dueReviewQuestionIds: new Set(["R1"]),
      size: 3,
      weights: { weak: 0, recent: 0, review: 1 },
    });
    // review target = 3, but only 1 review candidate exists; backfill pulls
    // in the rest from the general pool in candidate order.
    expect(result.map((r) => r.questionId)).toEqual(["R1", "W1", "N1"]);
  });

  it("caps the result at `size` even when every bucket has more candidates than needed", () => {
    const candidates = Array.from({ length: 50 }, (_, i) => q(`Q${i}`, "GRAMMAR"));
    const result = generatePracticeSet({
      candidates,
      weakSkillsAscending: ["GRAMMAR"],
      recentLessonIds: new Set(),
      dueReviewQuestionIds: new Set(),
      size: 15,
    });
    expect(result).toHaveLength(15);
  });
});
