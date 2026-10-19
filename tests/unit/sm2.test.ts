import { describe, expect, it } from "vitest";
import { SM2_INITIAL_STATE, sm2Review, type SM2State } from "@/lib/srs/sm2";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("sm2Review", () => {
  it("first successful review: interval 1 day, repetitions 1", () => {
    const { state, nextReviewAt } = sm2Review(SM2_INITIAL_STATE, 5, NOW);
    expect(state.repetitions).toBe(1);
    expect(state.intervalDays).toBe(1);
    expect(nextReviewAt.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });

  it("second successful review: interval jumps to 6 days", () => {
    const first = sm2Review(SM2_INITIAL_STATE, 5, NOW).state;
    const { state } = sm2Review(first, 5, NOW);
    expect(state.repetitions).toBe(2);
    expect(state.intervalDays).toBe(6);
  });

  it("third+ successful review: interval = previous interval * this review's updated ease factor", () => {
    let state = SM2_INITIAL_STATE;
    state = sm2Review(state, 5, NOW).state;
    const beforeThird = sm2Review(state, 5, NOW).state;
    const third = sm2Review(beforeThird, 5, NOW);
    expect(third.state.repetitions).toBe(3);
    // SM-2 updates the ease factor first, then uses the *new* ease factor to
    // compute the interval for this same review — not the pre-review value.
    expect(third.state.intervalDays).toBe(
      Math.round(beforeThird.intervalDays * third.state.easeFactor),
    );
  });

  it("a failed review (quality < 3) resets repetitions and interval regardless of history", () => {
    let state = SM2_INITIAL_STATE;
    state = sm2Review(state, 5, NOW).state;
    state = sm2Review(state, 5, NOW).state;
    state = sm2Review(state, 5, NOW).state; // several successes built up a long interval
    expect(state.intervalDays).toBeGreaterThan(6);

    const { state: afterLapse } = sm2Review(state, 1, NOW);
    expect(afterLapse.repetitions).toBe(0);
    expect(afterLapse.intervalDays).toBe(1);
  });

  it("ease factor increases on quality 5, is unchanged on quality 4, decreases on quality 3", () => {
    const base: SM2State = { intervalDays: 1, easeFactor: 2.5, repetitions: 0 };
    expect(sm2Review(base, 5, NOW).state.easeFactor).toBeCloseTo(2.6, 5);
    expect(sm2Review(base, 4, NOW).state.easeFactor).toBeCloseTo(2.5, 5);
    expect(sm2Review(base, 3, NOW).state.easeFactor).toBeCloseTo(2.36, 5);
  });

  it("ease factor never drops below the 1.3 floor even after repeated failures", () => {
    let state: SM2State = { intervalDays: 1, easeFactor: 1.35, repetitions: 3 };
    for (let i = 0; i < 10; i++) {
      state = sm2Review(state, 0, NOW).state;
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    expect(state.easeFactor).toBeCloseTo(1.3, 5);
  });

  it("nextReviewAt is exactly intervalDays after `now`, not wall-clock dependent", () => {
    const later = new Date("2026-06-15T12:30:00.000Z");
    const { state, nextReviewAt } = sm2Review(SM2_INITIAL_STATE, 5, later);
    expect(nextReviewAt.getTime() - later.getTime()).toBe(state.intervalDays * 86_400_000);
  });
});
