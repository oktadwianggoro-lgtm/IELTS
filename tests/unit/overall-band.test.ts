import { describe, expect, it } from "vitest";
import { calculateOverallBand } from "@/lib/scoring/overall-band";

describe("calculateOverallBand", () => {
  it("returns the band directly when all four skills already match (no rounding needed)", () => {
    expect(calculateOverallBand([7, 7, 7, 7])).toBe(7);
    expect(calculateOverallBand([6.5, 6.5, 6.5, 6.5])).toBe(6.5);
  });

  // Official ielts.org worked examples (see docs/SCORING.md citation).
  it("rounds a .25 average UP to the next half band (6.25 -> 6.5)", () => {
    // (6 + 6 + 6.5 + 6.5) / 4 = 6.25
    expect(calculateOverallBand([6, 6, 6.5, 6.5])).toBe(6.5);
  });

  it("rounds a .75 average UP to the next whole band (6.75 -> 7.0)", () => {
    // (6.5 + 7 + 7 + 6.5) / 4 = 6.75
    expect(calculateOverallBand([6.5, 7, 7, 6.5])).toBe(7);
  });

  it("rounds a .125 average DOWN to the nearest half band (6.125 -> 6.0)", () => {
    // (6 + 6 + 6 + 6.5) / 4 = 6.125
    expect(calculateOverallBand([6, 6, 6, 6.5])).toBe(6);
  });

  it("rounds a .375 average UP to the nearest half band (6.375 -> 6.5)", () => {
    // (6 + 6 + 6.5 + 7) / 4 = 6.375
    expect(calculateOverallBand([6, 6, 6.5, 7])).toBe(6.5);
  });

  it("rounds a .625 average to the nearest half band (6.625 -> 6.5)", () => {
    // (6 + 6.5 + 7 + 7) / 4 = 6.625
    expect(calculateOverallBand([6, 6.5, 7, 7])).toBe(6.5);
  });

  it("rounds a .875 average UP to the nearest whole band (6.875 -> 7.0)", () => {
    // (6.5 + 7 + 7 + 7) / 4 = 6.875
    expect(calculateOverallBand([6.5, 7, 7, 7])).toBe(7);
  });

  it("handles the lowest possible band (all zeros)", () => {
    expect(calculateOverallBand([0, 0, 0, 0])).toBe(0);
  });

  it("handles the highest possible band (all nines)", () => {
    expect(calculateOverallBand([9, 9, 9, 9])).toBe(9);
  });

  it("is order-independent", () => {
    expect(calculateOverallBand([6, 6.5, 7, 7])).toBe(calculateOverallBand([7, 6, 7, 6.5]));
  });
});
