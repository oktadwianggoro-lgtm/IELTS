import { describe, expect, it } from "vitest";
import { lessonFileSchema, questionSchema } from "@/lib/content/schema";

const validQuestion = {
  code: "Q1-TEST",
  type: "MULTIPLE_CHOICE" as const,
  prompt: { text: "Which letter comes first?" },
  options: [
    { id: "A", text: "A" },
    { id: "B", text: "B" },
  ],
  answerKey: "A",
  explanation: "A comes before B in the alphabet.",
};

function minimalLesson(overrides: Record<string, unknown> = {}) {
  return {
    code: "TEST-LESSON-001",
    coursePathCode: "PATH-TEST",
    moduleCode: "MOD-TEST",
    title: "A valid test lesson",
    level: "STARTER" as const,
    skill: "GRAMMAR" as const,
    estimatedMinutes: 10,
    order: 0,
    objectives: ["Objective one"],
    content: {
      explanationId: "Penjelasan ini sengaja dibuat cukup panjang untuk lolos validasi minimal.",
      coreConcept: "This core concept explanation is deliberately long enough to pass validation.",
      examples: [
        { correct: "I am a student.", reason: "Correct subject-verb agreement." },
        {
          correct: "She is happy.",
          incorrect: "She are happy.",
          reason: "Subject-verb agreement.",
        },
      ],
      commonMistakes: [{ mistake: "He go.", correction: "He goes.", note: "Third person -s." }],
      strategy: "Always check subject-verb agreement before submitting.",
      guidedPractice: [{ prompt: "Practice 1" }, { prompt: "Practice 2" }],
      independentPractice: [{ prompt: "Independent 1" }, { prompt: "Independent 2" }],
      summary: "This lesson covered basic subject-verb agreement rules.",
      checklist: ["I understand rule 1", "I understand rule 2"],
    },
    questions: Array.from({ length: 5 }, (_, i) => ({ ...validQuestion, code: `Q${i + 1}-TEST` })),
    ...overrides,
  };
}

describe("questionSchema", () => {
  it("accepts a well-formed multiple choice question", () => {
    expect(questionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it("rejects a multiple choice question whose answerKey isn't one of its option ids", () => {
    const result = questionSchema.safeParse({ ...validQuestion, answerKey: "Z" });
    expect(result.success).toBe(false);
  });

  it("rejects a multiple choice question with fewer than 2 options", () => {
    const result = questionSchema.safeParse({
      ...validQuestion,
      options: [{ id: "A", text: "A" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate option ids", () => {
    const result = questionSchema.safeParse({
      ...validQuestion,
      options: [
        { id: "A", text: "A" },
        { id: "A", text: "A again" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short-answer question without options (options not required)", () => {
    const result = questionSchema.safeParse({
      code: "Q-SA",
      type: "SHORT_ANSWER",
      prompt: { text: "Spell CAT" },
      answerKey: "C-A-T",
      explanation: "C, A, T spelled out.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a TRUE_FALSE_NOT_GIVEN question that incorrectly includes options", () => {
    const result = questionSchema.safeParse({
      code: "Q-TFNG",
      type: "TRUE_FALSE_NOT_GIVEN",
      prompt: { text: "The passage says X." },
      options: [{ id: "A", text: "True" }],
      answerKey: "TRUE",
      explanation: "The passage confirms this.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an explanation that is too short", () => {
    const result = questionSchema.safeParse({ ...validQuestion, explanation: "ok" });
    expect(result.success).toBe(false);
  });
});

describe("lessonFileSchema", () => {
  it("accepts a fully valid minimal lesson", () => {
    const result = lessonFileSchema.safeParse(minimalLesson());
    expect(result.success).toBe(true);
  });

  it("rejects a lesson with fewer than 5 quiz questions", () => {
    const result = lessonFileSchema.safeParse(minimalLesson({ questions: [validQuestion] }));
    expect(result.success).toBe(false);
  });

  it("rejects a lesson with fewer than 2 examples", () => {
    const lesson = minimalLesson();
    (lesson.content as { examples: unknown[] }).examples = [{ correct: "x", reason: "y" }];
    expect(lessonFileSchema.safeParse(lesson).success).toBe(false);
  });

  it("rejects a lesson code that isn't UPPER_SNAKE/UPPER-KEBAB", () => {
    const result = lessonFileSchema.safeParse(minimalLesson({ code: "lower-case-code" }));
    expect(result.success).toBe(false);
  });

  it("rejects a reference with an invalid verifiedAt date format", () => {
    const lesson = minimalLesson();
    (lesson.content as Record<string, unknown>).references = [
      { label: "IELTS official", url: "https://ielts.org", verifiedAt: "19 Oct 2026" },
    ];
    expect(lessonFileSchema.safeParse(lesson).success).toBe(false);
  });

  it("accepts a reference with a valid ISO date", () => {
    const lesson = minimalLesson();
    (lesson.content as Record<string, unknown>).references = [
      { label: "IELTS official", url: "https://ielts.org", verifiedAt: "2026-10-19" },
    ];
    expect(lessonFileSchema.safeParse(lesson).success).toBe(true);
  });
});
