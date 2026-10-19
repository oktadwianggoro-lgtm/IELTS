import { describe, expect, it } from "vitest";
import {
  lessonFileSchema,
  listeningPassageFileSchema,
  questionSchema,
  readingPassageFileSchema,
  speakingPromptFileSchema,
  writingTaskFileSchema,
} from "@/lib/content/schema";

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

function minimalListeningPassage(overrides: Record<string, unknown> = {}) {
  return {
    code: "TEST-LISTENING-001",
    title: "A valid test passage",
    section: "SECTION_1" as const,
    level: "STARTER" as const,
    accent: "American (synthesized)",
    audioFile: "test-passage.wav",
    durationSeconds: 60,
    script: [
      { speaker: "A", text: "Hello." },
      { speaker: "B", text: "Hi there." },
    ],
    questions: Array.from({ length: 3 }, (_, i) => ({ ...validQuestion, code: `LQ${i + 1}-TEST` })),
    ...overrides,
  };
}

describe("listeningPassageFileSchema", () => {
  it("accepts a fully valid minimal listening passage", () => {
    const result = listeningPassageFileSchema.safeParse(minimalListeningPassage());
    expect(result.success).toBe(true);
  });

  it("rejects a passage with fewer than 3 questions", () => {
    const passage = minimalListeningPassage();
    passage.questions = passage.questions.slice(0, 2);
    expect(listeningPassageFileSchema.safeParse(passage).success).toBe(false);
  });

  it("rejects a passage with an empty script", () => {
    const result = listeningPassageFileSchema.safeParse(minimalListeningPassage({ script: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects a script turn missing speaker or text", () => {
    const result = listeningPassageFileSchema.safeParse(
      minimalListeningPassage({ script: [{ speaker: "A" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid section value", () => {
    const result = listeningPassageFileSchema.safeParse(
      minimalListeningPassage({ section: "SECTION_5" }),
    );
    expect(result.success).toBe(false);
  });

  it("defaults difficulty to 3 when omitted", () => {
    const result = listeningPassageFileSchema.safeParse(minimalListeningPassage());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.difficulty).toBe(3);
  });
});

function minimalReadingPassage(overrides: Record<string, unknown> = {}) {
  return {
    code: "TEST-READING-001",
    title: "A valid test passage",
    examType: "ACADEMIC" as const,
    level: "B1" as const,
    topic: "testing",
    paragraphs: [
      { label: "A", text: "First paragraph." },
      { label: "B", text: "Second paragraph." },
    ],
    questions: Array.from({ length: 5 }, (_, i) => ({ ...validQuestion, code: `RQ${i + 1}-TEST` })),
    ...overrides,
  };
}

describe("readingPassageFileSchema", () => {
  it("accepts a fully valid minimal reading passage", () => {
    const result = readingPassageFileSchema.safeParse(minimalReadingPassage());
    expect(result.success).toBe(true);
  });

  it("rejects a passage with fewer than 5 questions", () => {
    const passage = minimalReadingPassage();
    passage.questions = passage.questions.slice(0, 4);
    expect(readingPassageFileSchema.safeParse(passage).success).toBe(false);
  });

  it("rejects a passage with no paragraphs", () => {
    const result = readingPassageFileSchema.safeParse(minimalReadingPassage({ paragraphs: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects a paragraph missing a label or text", () => {
    const result = readingPassageFileSchema.safeParse(
      minimalReadingPassage({ paragraphs: [{ label: "A" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid examType value", () => {
    const result = readingPassageFileSchema.safeParse(
      minimalReadingPassage({ examType: "IELTS_LIFE_SKILLS" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a question with evidence and wordLimit set", () => {
    const passage = minimalReadingPassage({
      questions: [
        { ...validQuestion, code: "RQ1-TEST", evidence: "Paragraf A: '...'", wordLimit: 2 },
        ...Array.from({ length: 4 }, (_, i) => ({ ...validQuestion, code: `RQ${i + 2}-TEST` })),
      ],
    });
    const result = readingPassageFileSchema.safeParse(passage);
    expect(result.success).toBe(true);
  });
});

function minimalWritingTask(overrides: Record<string, unknown> = {}) {
  return {
    code: "TEST-WRITING-001",
    title: "A valid test writing task",
    taskType: "TASK2" as const,
    level: "B1" as const,
    prompt: "This is a sufficiently long test prompt for the writing task.",
    minWords: 250,
    suggestedMinutes: 40,
    sampleAnswer:
      "This is a sufficiently long sample answer used only for schema validation purposes, not real content.",
    checklistItems: [
      "Checklist item one",
      "Checklist item two",
      "Checklist item three",
      "Checklist item four",
    ],
    ...overrides,
  };
}

describe("writingTaskFileSchema", () => {
  it("accepts a fully valid minimal writing task (TASK2, no visualData)", () => {
    const result = writingTaskFileSchema.safeParse(minimalWritingTask());
    expect(result.success).toBe(true);
  });

  it("rejects a task with fewer than 4 checklist items", () => {
    const task = minimalWritingTask();
    task.checklistItems = task.checklistItems.slice(0, 3);
    expect(writingTaskFileSchema.safeParse(task).success).toBe(false);
  });

  it("rejects a prompt that is too short", () => {
    const result = writingTaskFileSchema.safeParse(minimalWritingTask({ prompt: "Too short" }));
    expect(result.success).toBe(false);
  });

  it("requires visualData for TASK1_ACADEMIC", () => {
    const result = writingTaskFileSchema.safeParse(
      minimalWritingTask({ taskType: "TASK1_ACADEMIC" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts TASK1_ACADEMIC with a valid table visualData", () => {
    const result = writingTaskFileSchema.safeParse(
      minimalWritingTask({
        taskType: "TASK1_ACADEMIC",
        visualData: { type: "table", headers: ["Year", "Value"], rows: [["2020", "10"]] },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects TASK2 with a visualData set (only TASK1_ACADEMIC uses it)", () => {
    const result = writingTaskFileSchema.safeParse(
      minimalWritingTask({
        visualData: { type: "table", headers: ["A"], rows: [["1"]] },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid taskType value", () => {
    const result = writingTaskFileSchema.safeParse(minimalWritingTask({ taskType: "TASK3" }));
    expect(result.success).toBe(false);
  });
});

function minimalSpeakingPrompt(overrides: Record<string, unknown> = {}) {
  return {
    code: "TEST-SPEAKING-001",
    title: "A valid test speaking prompt",
    part: "PART1" as const,
    level: "A2" as const,
    topic: "Test topic",
    promptText: "This is a sufficiently long test prompt.",
    followUpQuestions: ["Question one?", "Question two?"],
    prepSeconds: 0,
    responseSeconds: 60,
    modelAnswer:
      "This is a sufficiently long model answer used only for schema validation purposes, not real content.",
    checklistItems: [
      "Checklist item one",
      "Checklist item two",
      "Checklist item three",
      "Checklist item four",
    ],
    ...overrides,
  };
}

describe("speakingPromptFileSchema", () => {
  it("accepts a fully valid minimal PART1 prompt", () => {
    const result = speakingPromptFileSchema.safeParse(minimalSpeakingPrompt());
    expect(result.success).toBe(true);
  });

  it("rejects a prompt with fewer than 4 checklist items", () => {
    const prompt = minimalSpeakingPrompt();
    prompt.checklistItems = prompt.checklistItems.slice(0, 3);
    expect(speakingPromptFileSchema.safeParse(prompt).success).toBe(false);
  });

  it("rejects PART1 with fewer than 2 followUpQuestions", () => {
    const result = speakingPromptFileSchema.safeParse(
      minimalSpeakingPrompt({ followUpQuestions: ["Only one?"] }),
    );
    expect(result.success).toBe(false);
  });

  it("requires cueCardPoints for PART2", () => {
    const result = speakingPromptFileSchema.safeParse(
      minimalSpeakingPrompt({ part: "PART2", followUpQuestions: [] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts PART2 with valid cueCardPoints and no followUpQuestions", () => {
    const result = speakingPromptFileSchema.safeParse(
      minimalSpeakingPrompt({
        part: "PART2",
        followUpQuestions: [],
        cueCardPoints: ["Point one", "Point two"],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects PART1/PART3 with a cueCardPoints set (only PART2 uses it)", () => {
    const result = speakingPromptFileSchema.safeParse(
      minimalSpeakingPrompt({ cueCardPoints: ["Should not be here"] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid part value", () => {
    const result = speakingPromptFileSchema.safeParse(minimalSpeakingPrompt({ part: "PART4" }));
    expect(result.success).toBe(false);
  });
});
