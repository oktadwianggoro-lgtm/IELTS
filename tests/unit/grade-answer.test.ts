import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/content/grade-answer";

describe("gradeAnswer", () => {
  it("matches a short-answer question case-insensitively and trims whitespace", () => {
    const q = { type: "SHORT_ANSWER", answerKey: "C-A-T" };
    expect(gradeAnswer(q, "  c-a-t  ")).toBe(true);
    expect(gradeAnswer(q, "C-A-T")).toBe(true);
    expect(gradeAnswer(q, "dog")).toBe(false);
  });

  it("accepts any listed acceptedAnswers alternative", () => {
    const q = { type: "GAP_FILL", answerKey: "spell", acceptedAnswers: ["Spell", "spelling"] };
    expect(gradeAnswer(q, "spelling")).toBe(true);
    expect(gradeAnswer(q, "write")).toBe(false);
  });

  it("matches multiple choice by option id", () => {
    const q = {
      type: "MULTIPLE_CHOICE",
      answerKey: "B",
      options: [
        { id: "A", text: "Wrong" },
        { id: "B", text: "Right" },
      ],
    };
    expect(gradeAnswer(q, "B")).toBe(true);
    expect(gradeAnswer(q, "A")).toBe(false);
  });

  it("grades ORDERING by resolving option ids in the answer key to their text, not raw id equality", () => {
    // Regression test: the free-text ordering UI collects option *text*
    // (e.g. "A, B, C, D"), but the stored answerKey is a sequence of option
    // *ids* (e.g. ["opt4","opt2","opt3","opt1"]). A naive array-equality
    // check against the raw ids would mark every correct answer wrong.
    const q = {
      type: "ORDERING",
      options: [
        { id: "opt1", text: "D" },
        { id: "opt2", text: "B" },
        { id: "opt3", text: "C" },
        { id: "opt4", text: "A" },
      ],
      answerKey: ["opt4", "opt2", "opt3", "opt1"], // means the letters A, B, C, D in order
    };

    expect(gradeAnswer(q, ["A", "B", "C", "D"])).toBe(true);
    expect(gradeAnswer(q, ["a", " b ", "C", "D"])).toBe(true); // case/whitespace tolerant
    expect(gradeAnswer(q, ["D", "C", "B", "A"])).toBe(false);
    expect(gradeAnswer(q, ["A", "B", "C"])).toBe(false); // wrong length
  });

  it("grades MATCHING the same way: ids in the answer key resolve to option text", () => {
    const q = {
      type: "MATCHING",
      options: [
        { id: "x", text: "Paris" },
        { id: "y", text: "Tokyo" },
      ],
      answerKey: ["x"],
    };
    expect(gradeAnswer(q, "Paris")).toBe(true);
    expect(gradeAnswer(q, "Tokyo")).toBe(false);
  });
});
