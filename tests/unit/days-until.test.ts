import { describe, expect, it } from "vitest";
import {
  daysUntil,
  resolvePlanHorizonDays,
  DEFAULT_PLAN_HORIZON_DAYS,
  MAX_PLAN_HORIZON_DAYS,
} from "@/lib/study-plan/days-until";

const TODAY = new Date("2026-10-20T15:30:00.000Z"); // deliberately not midnight

describe("daysUntil", () => {
  it("returns 0 for the same calendar day regardless of time-of-day", () => {
    expect(daysUntil(new Date("2026-10-20T08:00:00.000Z"), TODAY)).toBe(0);
  });

  it("counts whole days forward", () => {
    expect(daysUntil(new Date("2026-11-19T00:00:00.000Z"), TODAY)).toBe(30);
  });

  it("returns a negative number for a date already in the past", () => {
    expect(daysUntil(new Date("2026-10-10T00:00:00.000Z"), TODAY)).toBe(-10);
  });
});

describe("resolvePlanHorizonDays", () => {
  it("uses the default horizon when no test date is set", () => {
    expect(resolvePlanHorizonDays(null, TODAY)).toBe(DEFAULT_PLAN_HORIZON_DAYS);
  });

  it("uses the default horizon when the test date has already passed", () => {
    expect(resolvePlanHorizonDays(new Date("2026-01-01"), TODAY)).toBe(DEFAULT_PLAN_HORIZON_DAYS);
  });

  it("uses the exact days-until-exam when it's within the cap", () => {
    expect(resolvePlanHorizonDays(new Date("2026-10-30T00:00:00.000Z"), TODAY)).toBe(10);
  });

  it("clamps a far-future test date to the maximum horizon", () => {
    const farFuture = new Date("2028-01-01T00:00:00.000Z");
    expect(resolvePlanHorizonDays(farFuture, TODAY)).toBe(MAX_PLAN_HORIZON_DAYS);
  });
});
