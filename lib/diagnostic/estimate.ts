import type { PedagogicalLevel, SkillArea } from "@prisma/client";

export type AnsweredQuestion = {
  level: PedagogicalLevel;
  skill: SkillArea;
  correct: boolean;
};

export type SkillEstimateResult = {
  skill: SkillArea;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
};

export type DiagnosticEstimate = {
  estimatedLevel: PedagogicalLevel;
  /** 0-1. Intentionally capped low — see docs/DECISIONS.md. */
  confidence: number;
  skillEstimates: SkillEstimateResult[];
  levelsSampled: PedagogicalLevel[];
};

const LEVEL_ORDER: PedagogicalLevel[] = ["STARTER", "A1", "A2", "B1", "B2", "C1_ENRICHMENT"];

const MASTERY_THRESHOLD = 0.7;

/**
 * Estimates a level from accuracy per sampled level, never claiming
 * precision the question bank can't support: it only ever returns a level
 * that was actually represented in the sample (or the lowest known level if
 * the sample doesn't clear the mastery bar anywhere), and confidence is
 * capped low and shrinks further when few distinct levels were sampled —
 * two correct answers at one level says much less than the same accuracy
 * spread across three levels.
 */
export function estimateDiagnostic(answers: AnsweredQuestion[]): DiagnosticEstimate {
  if (answers.length === 0) {
    return { estimatedLevel: "STARTER", confidence: 0, skillEstimates: [], levelsSampled: [] };
  }

  const byLevel = new Map<PedagogicalLevel, { correct: number; total: number }>();
  const bySkill = new Map<SkillArea, { correct: number; total: number }>();

  for (const a of answers) {
    const l = byLevel.get(a.level) ?? { correct: 0, total: 0 };
    l.total += 1;
    if (a.correct) l.correct += 1;
    byLevel.set(a.level, l);

    const s = bySkill.get(a.skill) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.correct) s.correct += 1;
    bySkill.set(a.skill, s);
  }

  const levelsSampled = LEVEL_ORDER.filter((l) => byLevel.has(l));

  // Walk sampled levels from highest to lowest; the estimate is the highest
  // level at which accuracy clears the mastery threshold. If none clear it,
  // fall back to the lowest sampled level (there's nowhere lower to send
  // the learner, but the honest answer is still "needs more practice here").
  let estimatedLevel: PedagogicalLevel = levelsSampled[0] ?? "STARTER";
  for (let i = levelsSampled.length - 1; i >= 0; i--) {
    const level = levelsSampled[i];
    const stats = byLevel.get(level)!;
    if (stats.correct / stats.total >= MASTERY_THRESHOLD) {
      estimatedLevel = level;
      break;
    }
    estimatedLevel = level; // keeps shrinking toward the lowest sampled level
  }

  const totalQuestions = answers.length;
  // Base confidence grows slowly with sample size, then is further capped
  // based on how many distinct levels were actually sampled — distinguishing
  // "A1 vs A2" needs A2 questions in the sample, not just more A1 questions.
  const sizeConfidence = Math.min(0.15 + totalQuestions * 0.012, 0.55);
  const levelSpreadFactor = Math.min(0.4 + levelsSampled.length * 0.2, 1);
  const confidence = Math.round(sizeConfidence * levelSpreadFactor * 100) / 100;

  const skillEstimates: SkillEstimateResult[] = Array.from(bySkill.entries()).map(
    ([skill, stats]) => ({
      skill,
      correctCount: stats.correct,
      totalCount: stats.total,
      scorePercent: Math.round((stats.correct / stats.total) * 1000) / 10,
    }),
  );

  return { estimatedLevel, confidence, skillEstimates, levelsSampled };
}
