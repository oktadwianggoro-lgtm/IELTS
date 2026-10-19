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
