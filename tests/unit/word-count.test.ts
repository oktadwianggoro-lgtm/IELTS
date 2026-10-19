import { describe, expect, it } from "vitest";
import { countWords } from "@/lib/content/word-count";

describe("countWords", () => {
  it("returns 0 for an empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for a string that is only whitespace", () => {
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("counts single words correctly", () => {
    expect(countWords("hello")).toBe(1);
  });

  it("counts multiple words separated by single spaces", () => {
    expect(countWords("the quick brown fox")).toBe(4);
  });

  it("treats multiple consecutive spaces as one separator", () => {
    expect(countWords("the   quick    brown fox")).toBe(4);
  });

  it("treats newlines and tabs as word separators", () => {
    expect(countWords("line one\nline two\tline three")).toBe(6);
  });

  it("ignores leading and trailing whitespace", () => {
    expect(countWords("  padded text  ")).toBe(2);
  });
});
