import { describe, expect, it } from "vitest";
import { generateToken, minutesFromNow } from "@/lib/auth/tokens";

describe("auth tokens", () => {
  it("generates sufficiently long, URL-safe hex tokens", () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
    expect(tokens.size).toBe(50);
  });

  it("minutesFromNow produces a future timestamp by the given offset", () => {
    const now = Date.now();
    const future = minutesFromNow(60);
    const diffMinutes = (future.getTime() - now) / 60_000;
    expect(diffMinutes).toBeGreaterThan(59);
    expect(diffMinutes).toBeLessThan(61);
  });
});
