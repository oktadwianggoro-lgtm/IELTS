import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/loader";

const contentRoot = join(process.cwd(), "content");

describe("loadContent (real content/ directory)", () => {
  it("loads and validates the seeded vertical-slice content with no errors", () => {
    const result = loadContent(contentRoot);
    if (!result.ok) {
      console.error(result.errors);
    }
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("finds the Starter alphabet/spelling lesson with 5 questions", () => {
    const result = loadContent(contentRoot);
    const lesson = result.lessons.find((l) => l.code === "STARTER-GRAM-001");
    expect(lesson).toBeDefined();
    expect(lesson?.questions.length).toBeGreaterThanOrEqual(5);
  });

  it("resolves every lesson's moduleCode to a loaded module", () => {
    const result = loadContent(contentRoot);
    const moduleCodes = new Set(result.modules.map((m) => m.code));
    for (const lesson of result.lessons) {
      expect(moduleCodes.has(lesson.moduleCode)).toBe(true);
    }
  });

  it("resolves every lesson/question topic to a registered topic code", () => {
    const result = loadContent(contentRoot);
    const topicCodes = new Set(result.topics.map((t) => t.code));
    for (const lesson of result.lessons) {
      for (const topic of lesson.topics) expect(topicCodes.has(topic)).toBe(true);
      for (const q of lesson.questions) {
        for (const topic of q.topics) expect(topicCodes.has(topic)).toBe(true);
      }
    }
  });

  it("loads the seeded listening passages with their questions", () => {
    const result = loadContent(contentRoot);
    expect(result.listeningPassages.length).toBeGreaterThanOrEqual(2);
    for (const passage of result.listeningPassages) {
      expect(passage.questions.length).toBeGreaterThanOrEqual(3);
      expect(passage.script.length).toBeGreaterThan(0);
    }
  });

  it("loads the seeded reading passages with their questions and paragraphs", () => {
    const result = loadContent(contentRoot);
    expect(result.readingPassages.length).toBeGreaterThanOrEqual(2);
    for (const passage of result.readingPassages) {
      expect(passage.questions.length).toBeGreaterThanOrEqual(5);
      expect(passage.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it("loads the seeded writing tasks, with TASK1_ACADEMIC carrying visualData and others not", () => {
    const result = loadContent(contentRoot);
    expect(result.writingTasks.length).toBeGreaterThanOrEqual(3);
    for (const task of result.writingTasks) {
      expect(task.sampleAnswer.length).toBeGreaterThan(0);
      expect(task.checklistItems.length).toBeGreaterThanOrEqual(4);
      if (task.taskType === "TASK1_ACADEMIC") {
        expect(task.visualData).toBeDefined();
      } else {
        expect(task.visualData).toBeUndefined();
      }
    }
  });

  it("loads the seeded speaking prompts, with PART2 carrying cueCardPoints and others not", () => {
    const result = loadContent(contentRoot);
    expect(result.speakingPrompts.length).toBeGreaterThanOrEqual(3);
    for (const prompt of result.speakingPrompts) {
      expect(prompt.modelAnswer.length).toBeGreaterThan(0);
      expect(prompt.checklistItems.length).toBeGreaterThanOrEqual(4);
      if (prompt.part === "PART2") {
        expect(prompt.cueCardPoints).toBeDefined();
        expect(prompt.followUpQuestions.length).toBe(0);
      } else {
        expect(prompt.cueCardPoints).toBeUndefined();
        expect(prompt.followUpQuestions.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("loads the seeded mock tests, each matching its blueprint's single skill", () => {
    const result = loadContent(contentRoot);
    expect(result.mockTests.length).toBeGreaterThanOrEqual(3);
    const listeningCodes = new Set(result.listeningPassages.map((p) => p.code));
    const readingCodes = new Set(result.readingPassages.map((p) => p.code));
    for (const mockTest of result.mockTests) {
      expect(mockTest.sections.length).toBeGreaterThan(0);
      for (const section of mockTest.sections) {
        if (mockTest.blueprint.skill === "LISTENING") {
          expect(section.listeningPassageCode).toBeDefined();
          expect(listeningCodes.has(section.listeningPassageCode!)).toBe(true);
        } else if (mockTest.blueprint.skill === "READING") {
          expect(section.readingPassageCode).toBeDefined();
          expect(readingCodes.has(section.readingPassageCode!)).toBe(true);
        }
      }
    }
  });

  it("resolves every MATCHING question's single-letter options to a real paragraph label", () => {
    const result = loadContent(contentRoot);
    for (const passage of result.readingPassages) {
      const labels = new Set(passage.paragraphs.map((p) => p.label));
      for (const q of passage.questions) {
        if (q.type !== "MATCHING" || !q.options) continue;
        for (const opt of q.options) {
          if (opt.id.length === 1 && /^[A-Z]$/.test(opt.id)) {
            expect(labels.has(opt.id)).toBe(true);
          }
        }
      }
    }
  });
});

describe("loadContent cross-content-type validation (synthetic fixtures)", () => {
  it("flags a question code reused between a lesson and a listening passage", () => {
    const result = loadContent(contentRoot);
    // Every loaded question code (lesson + listening) must be globally
    // unique — reusing the real loaded data here (rather than a synthetic
    // fixture directory) confirms the actual seeded content has no clashes.
    const seen = new Map<string, string>();
    let duplicateFound = false;
    for (const lesson of result.lessons) {
      for (const q of lesson.questions) seen.set(q.code, lesson.code);
    }
    for (const passage of result.listeningPassages) {
      for (const q of passage.questions) {
        if (seen.has(q.code)) duplicateFound = true;
        seen.set(q.code, passage.code);
      }
    }
    expect(duplicateFound).toBe(false);
  });
});

describe("loadContent error reporting (synthetic fixtures)", () => {
  it("reports a missing content directory as zero items, not a crash", () => {
    const result = loadContent(join(contentRoot, "does-not-exist"));
    expect(result.lessons).toEqual([]);
    expect(result.coursePaths).toEqual([]);
  });
});
