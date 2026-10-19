import type { SkillArea } from "@prisma/client";

export type PracticeCandidate = {
  questionId: string;
  skill: SkillArea;
  lessonId: string | null;
};

export type PracticeSetWeights = { weak: number; recent: number; review: number };

/** Master Prompt §8.4: "50% kelemahan, 30% materi terbaru, 20% review". */
export const DEFAULT_PRACTICE_WEIGHTS: PracticeSetWeights = { weak: 0.5, recent: 0.3, review: 0.2 };

export type GeneratePracticeSetInput = {
  /** Already in the order the caller wants ties broken in (e.g. shuffled
   * upstream) — this function never randomizes, so it stays deterministic
   * and testable. */
  candidates: PracticeCandidate[];
  /** Weakest skill first. */
  weakSkillsAscending: SkillArea[];
  recentLessonIds: Set<string>;
  dueReviewQuestionIds: Set<string>;
  size: number;
  weights?: PracticeSetWeights;
};

function takeFromBucket(
  pool: PracticeCandidate[],
  target: number,
  chosen: PracticeCandidate[],
  chosenIds: Set<string>,
  size: number,
): void {
  let added = 0;
  for (const candidate of pool) {
    if (added >= target || chosen.length >= size) break;
    if (chosenIds.has(candidate.questionId)) continue;
    chosen.push(candidate);
    chosenIds.add(candidate.questionId);
    added++;
  }
}

/**
 * Builds one adaptive practice set: a mix of due mistake-book reviews, weak
 * skills, and recently-studied material (Master Prompt §8.4), falling back
 * to the general candidate pool when a bucket is thinner than its target so
 * a small question bank still returns as full a set as it can.
 */
export function generatePracticeSet(input: GeneratePracticeSetInput): PracticeCandidate[] {
  const { candidates, weakSkillsAscending, recentLessonIds, dueReviewQuestionIds, size } = input;
  const weights = input.weights ?? DEFAULT_PRACTICE_WEIGHTS;
  if (size <= 0 || candidates.length === 0) return [];

  const reviewPool = candidates.filter((c) => dueReviewQuestionIds.has(c.questionId));

  const weakRank = new Map(weakSkillsAscending.map((skill, i) => [skill, i]));
  const weakPool = candidates
    .filter((c) => weakRank.has(c.skill))
    .sort((a, b) => weakRank.get(a.skill)! - weakRank.get(b.skill)!);

  const recentPool = candidates.filter(
    (c) => c.lessonId != null && recentLessonIds.has(c.lessonId),
  );

  const reviewTarget = Math.round(size * weights.review);
  const weakTarget = Math.round(size * weights.weak);
  const recentTarget = Math.max(0, size - reviewTarget - weakTarget);

  const chosen: PracticeCandidate[] = [];
  const chosenIds = new Set<string>();

  // Due reviews are time-sensitive (an overdue SM-2 card only gets harder to
  // recall the longer it waits), so they're filled first and never crowded
  // out by the other two buckets.
  takeFromBucket(reviewPool, reviewTarget, chosen, chosenIds, size);
  takeFromBucket(weakPool, weakTarget, chosen, chosenIds, size);
  takeFromBucket(recentPool, recentTarget, chosen, chosenIds, size);
  // Backfill from the full candidate pool if any bucket came up short.
  takeFromBucket(candidates, size, chosen, chosenIds, size);

  return chosen;
}
