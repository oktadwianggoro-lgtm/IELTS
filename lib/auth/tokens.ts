import { randomBytes } from "node:crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

export const EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24; // 24h
export const PASSWORD_RESET_TTL_MINUTES = 60; // 1h
