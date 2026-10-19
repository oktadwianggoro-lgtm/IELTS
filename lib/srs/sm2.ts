/**
 * SuperMemo SM-2 spaced-repetition algorithm (Wozniak, 1987), applied one
 * review at a time. `quality` is the algorithm's standard 0-5 recall-quality
 * scale: 0-2 means failed recall (the interval resets to 1 day), 3-5 means
 * successful recall of increasing ease. See docs/DECISIONS.md for why SM-2
 * was picked over FSRS for Fase 6 (Master Prompt §8.10 allows either).
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type SM2State = {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
};

export const SM2_INITIAL_STATE: SM2State = { intervalDays: 1, easeFactor: 2.5, repetitions: 0 };

const MIN_EASE_FACTOR = 1.3;

export function sm2Review(
  state: SM2State,
  quality: SM2Quality,
  now: Date,
): { state: SM2State; nextReviewAt: Date } {
  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  let repetitions: number;
  let intervalDays: number;
  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * easeFactor);
  }

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return { state: { intervalDays, easeFactor, repetitions }, nextReviewAt };
}
