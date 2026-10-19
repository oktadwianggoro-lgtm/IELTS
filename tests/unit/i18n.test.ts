import { describe, expect, it } from "vitest";
import { dictionary, locales } from "@/lib/i18n/dictionary";

function keys(obj: object): string[] {
  return Object.keys(obj).sort();
}

describe("i18n dictionary", () => {
  it("has the same top-level sections for every locale", () => {
    const [first, ...rest] = locales.map((locale) => keys(dictionary[locale]));
    for (const other of rest) {
      expect(other).toEqual(first);
    }
  });

  it("has matching nav keys across locales", () => {
    const [first, ...rest] = locales.map((locale) => keys(dictionary[locale].nav));
    for (const other of rest) {
      expect(other).toEqual(first);
    }
  });

  it("has matching common keys across locales", () => {
    const [first, ...rest] = locales.map((locale) => keys(dictionary[locale].common));
    for (const other of rest) {
      expect(other).toEqual(first);
    }
  });

  it("has the same number of landing skills across locales", () => {
    const lengths = locales.map((locale) => dictionary[locale].landing.skills.length);
    expect(new Set(lengths).size).toBe(1);
    expect(lengths[0]).toBeGreaterThan(0);
  });

  it("includes the required IELTS disclaimer for every locale", () => {
    for (const locale of locales) {
      expect(dictionary[locale].disclaimer.length).toBeGreaterThan(0);
    }
  });
});
