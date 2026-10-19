"use server";

import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  generateToken,
  minutesFromNow,
  EMAIL_VERIFICATION_TTL_MINUTES,
  PASSWORD_RESET_TTL_MINUTES,
} from "@/lib/auth/tokens";
import { sendMail, verificationEmail, passwordResetEmail } from "@/lib/email/mailer";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

async function issueVerificationToken(email: string) {
  const token = generateToken();
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: minutesFromNow(EMAIL_VERIFICATION_TTL_MINUTES) },
  });
  const { subject, html, text } = verificationEmail(appUrl(`/verify-email?token=${token}`));
  await sendMail({ to: email, subject, html, text });
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: ["Email sudah terdaftar. Silakan masuk."] } };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      profile: { create: {} },
      preference: { create: {} },
    },
  });

  await issueVerificationToken(email);

  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Akun dibuat, tetapi auto-login gagal. Silakan masuk manual." };
    }
    throw error;
  }
  return null;
}

export async function resendVerificationAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Anda harus masuk terlebih dahulu." };
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.emailVerified) {
    return { success: true };
  }
  await issueVerificationToken(user.email);
  return { success: true };
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email atau password salah." };
      }
      return { error: "Gagal masuk. Silakan coba lagi." };
    }
    throw error;
  }
  return null;
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always behave the same whether or not the account exists, so the form
  // can't be used to enumerate registered emails.
  if (user) {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: minutesFromNow(PASSWORD_RESET_TTL_MINUTES) },
    });
    const { subject, html, text } = passwordResetEmail(appUrl(`/reset-password?token=${token}`));
    await sendMail({ to: user.email, subject, html, text });
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "Tautan reset password tidak valid atau sudah kedaluwarsa." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
