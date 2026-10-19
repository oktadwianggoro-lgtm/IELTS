import { z } from "zod";

/**
 * At least 8 chars, one letter and one number. Deliberately not stricter —
 * long passphrases should pass without forcing symbol gymnastics.
 */
const passwordSchema = z
  .string()
  .min(8, "Minimal 8 karakter")
  .max(100)
  .regex(/[a-zA-Z]/, "Harus mengandung huruf")
  .regex(/[0-9]/, "Harus mengandung angka");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
