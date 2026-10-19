import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema, resetPasswordSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Budi Santoso",
      email: "Budi@Example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("budi@example.com"); // normalised
    }
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "budi@example.com",
      password: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a letter", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "budi@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "budi@example.com",
      password: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "not-an-email",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a one-character name", () => {
    const result = registerSchema.safeParse({
      name: "B",
      email: "budi@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength is only enforced at registration)", () => {
    const result = loginSchema.safeParse({ email: "budi@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "budi@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({ token: "", password: "Password123" });
    expect(result.success).toBe(false);
  });
});
