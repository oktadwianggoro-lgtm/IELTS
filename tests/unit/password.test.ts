import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("round-trips: a correct password verifies against its own hash", async () => {
    const hash = await hashPassword("CorrectHorse123");
    await expect(verifyPassword("CorrectHorse123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against an existing hash", async () => {
    const hash = await hashPassword("CorrectHorse123");
    await expect(verifyPassword("WrongPassword123", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const hash = await hashPassword("CorrectHorse123");
    expect(hash).not.toContain("CorrectHorse123");
  });

  it("produces a different hash each time (random salt)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("SamePassword1"),
      hashPassword("SamePassword1"),
    ]);
    expect(a).not.toBe(b);
  });
});
