import { describe, expect, it } from "vitest";
import { estimateDiagnostic, type AnsweredQuestion } from "@/lib/diagnostic/estimate";

function make(
  level: AnsweredQuestion["level"],
  skill: AnsweredQuestion["skill"],
  correct: boolean,
) {
  return { level, skill, correct };
}

describe("estimateDiagnostic", () => {
  it("returns a zero-confidence Starter default for no answers", () => {
    const result = estimateDiagnostic([]);
    expect(result.estimatedLevel).toBe("STARTER");
    expect(result.confidence).toBe(0);
    expect(result.skillEstimates).toEqual([]);
  });

  it("stays at the only sampled level even with a perfect score (can't promote past what was tested)", () => {
    const answers: AnsweredQuestion[] = Array.from({ length: 10 }, () =>
      make("STARTER", "GRAMMAR", true),
    );
    const result = estimateDiagnostic(answers);
    expect(result.estimatedLevel).toBe("STARTER");
    expect(result.levelsSampled).toEqual(["STARTER"]);
  });

  it("promotes to the highest sampled level that clears the mastery threshold", () => {
    const answers: AnsweredQuestion[] = [
      ...Array.from({ length: 9 }, () => make("STARTER", "GRAMMAR", true)),
      make("STARTER", "GRAMMAR", false), // 90% at STARTER
      ...Array.from({ length: 4 }, () => make("A1", "GRAMMAR", true)),
      make("A1", "GRAMMAR", false), // 80% at A1
    ];
    const result = estimateDiagnostic(answers);
    expect(result.estimatedLevel).toBe("A1");
  });

  it("falls back toward the lowest sampled level when higher levels don't clear the threshold", () => {
    const answers: AnsweredQuestion[] = [
      ...Array.from({ length: 9 }, () => make("STARTER", "GRAMMAR", true)),
      make("STARTER", "GRAMMAR", false), // 90% at STARTER
      ...Array.from({ length: 2 }, () => make("A1", "GRAMMAR", true)),
      ...Array.from({ length: 3 }, () => make("A1", "GRAMMAR", false)), // 40% at A1
    ];
    const result = estimateDiagnostic(answers);
    expect(result.estimatedLevel).toBe("STARTER");
  });

  it("falls back to the lowest sampled level when nothing clears the threshold at all", () => {
    const answers: AnsweredQuestion[] = [
      make("STARTER", "GRAMMAR", true),
      make("STARTER", "GRAMMAR", false),
      make("STARTER", "GRAMMAR", false), // 33% at STARTER
      make("A1", "GRAMMAR", false),
      make("A1", "GRAMMAR", false), // 0% at A1
    ];
    const result = estimateDiagnostic(answers);
    expect(result.estimatedLevel).toBe("STARTER");
  });

  it("computes per-skill breakdown independently of level", () => {
    const answers: AnsweredQuestion[] = [
      make("STARTER", "GRAMMAR", true),
      make("STARTER", "GRAMMAR", true),
      make("STARTER", "VOCABULARY", true),
      make("STARTER", "VOCABULARY", false),
    ];
    const result = estimateDiagnostic(answers);
    const grammar = result.skillEstimates.find((s) => s.skill === "GRAMMAR")!;
    const vocab = result.skillEstimates.find((s) => s.skill === "VOCABULARY")!;
    expect(grammar).toEqual({
      skill: "GRAMMAR",
      correctCount: 2,
      totalCount: 2,
      scorePercent: 100,
    });
    expect(vocab).toEqual({
      skill: "VOCABULARY",
      correctCount: 1,
      totalCount: 2,
      scorePercent: 50,
    });
  });

  it("gives higher confidence to a larger, multi-level sample than a small single-level one", () => {
    const small = estimateDiagnostic([
      make("STARTER", "GRAMMAR", true),
      make("STARTER", "GRAMMAR", true),
    ]);
    const large: AnsweredQuestion[] = [
      ...Array.from({ length: 15 }, () => make("STARTER", "GRAMMAR", true)),
      ...Array.from({ length: 15 }, () => make("A1", "GRAMMAR", true)),
    ];
    const big = estimateDiagnostic(large);
    expect(big.confidence).toBeGreaterThan(small.confidence);
  });

  it("never reports confidence above a conservative cap, regardless of sample size", () => {
    const huge: AnsweredQuestion[] = Array.from({ length: 500 }, () =>
      make("STARTER", "GRAMMAR", true),
    );
    const result = estimateDiagnostic(huge);
    expect(result.confidence).toBeLessThanOrEqual(0.6);
  });
});
