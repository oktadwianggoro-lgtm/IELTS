import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { uniqueEmail, register, skipOnboarding, signOut } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("unauthenticated access", () => {
  test("visiting a protected page redirects to /login with callbackUrl", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
  });

  test("visiting /admin while logged out redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("register, onboarding, sign out, sign in", () => {
  test("full happy path", async ({ page }) => {
    const email = uniqueEmail("happy");
    const password = "Password123";

    await register(page, email, password);
    await expect(page).toHaveURL(/\/onboarding$/);

    // Step 1: goal + test type (defaults are fine) -> Lanjut
    await page.getByRole("button", { name: "Lanjut: Target" }).click();
    // Step 2: targets (all optional) -> Lanjut
    await page.getByRole("button", { name: "Lanjut: Kebiasaan belajar" }).click();
    // Step 3: study habits -> Selesai
    await page.getByRole("button", { name: "Selesai" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/onboarding selesai/i)).toBeVisible();
    await expect(page.getByText(/email anda belum diverifikasi/i)).toBeVisible();

    // Sign out
    await signOut(page);

    // Protected route now redirects again
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // Sign back in
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("onboarding can be skipped and resumed from the profile page", async ({ page }) => {
    const email = uniqueEmail("skip");
    await register(page, email, "Password123");
    await expect(page).toHaveURL(/\/onboarding$/);
    await skipOnboarding(page);
    await expect(page.getByText(/lengkapi tujuan belajar anda/i)).toBeVisible();

    await page.goto("/profil");
    await expect(page.getByText(/anda belum melengkapi onboarding/i)).toBeVisible();
  });

  test("wrong password shows an error and does not sign in", async ({ page }) => {
    const email = uniqueEmail("wrongpw");
    await register(page, email, "Password123");
    await skipOnboarding(page);
    await signOut(page);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("TotallyWrong1");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText(/email atau password salah/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("registering with an already-used email shows a field error", async ({ page }) => {
    const email = uniqueEmail("dupe");
    await register(page, email, "Password123");
    await skipOnboarding(page);
    await signOut(page);

    await register(page, email, "AnotherPass1");
    await expect(page.getByText(/email sudah terdaftar/i)).toBeVisible();
  });
});

test.describe("email verification", () => {
  test("clicking the verification link clears the unverified banner", async ({ page }) => {
    const email = uniqueEmail("verify");
    await register(page, email, "Password123");
    await skipOnboarding(page);
    await expect(page.getByText(/email anda belum diverifikasi/i)).toBeVisible();

    const verification = await prisma.verificationToken.findFirstOrThrow({
      where: { identifier: email },
      orderBy: { expires: "desc" },
    });

    await page.goto(`/verify-email?token=${verification.token}`);
    await expect(page.getByText(/email terverifikasi/i)).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(/email anda belum diverifikasi/i)).not.toBeVisible();
  });

  test("an invalid verification token shows an error, not a crash", async ({ page }) => {
    await page.goto("/verify-email?token=not-a-real-token");
    await expect(page.getByText(/tautan tidak valid/i)).toBeVisible();
  });
});

test.describe("forgot / reset password", () => {
  test("resetting the password via the emailed token allows signing in with the new password", async ({
    page,
  }) => {
    const email = uniqueEmail("reset");
    const oldPassword = "Password123";
    const newPassword = "NewPassword456";

    await register(page, email, oldPassword);
    await skipOnboarding(page);
    await signOut(page);

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Kirim tautan reset" }).click();
    await expect(page.getByText(/jika email terdaftar/i)).toBeVisible();

    const resetToken = await prisma.passwordResetToken.findFirstOrThrow({
      where: { user: { email } },
      orderBy: { createdAt: "desc" },
    });

    await page.goto(`/reset-password?token=${resetToken.token}`);
    await page.getByLabel("Password baru").fill(newPassword);
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText(/password berhasil diubah/i)).toBeVisible();

    await page.getByRole("link", { name: "Ke halaman masuk" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(oldPassword);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByText(/email atau password salah/i)).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an invalid reset token is rejected", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await page.getByLabel("Password baru").fill("SomePassword1");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText(/tidak valid atau sudah kedaluwarsa/i)).toBeVisible();
  });
});

test.describe("role-based access control", () => {
  test("a student cannot reach /admin and is redirected to the dashboard", async ({ page }) => {
    const email = uniqueEmail("student");
    await register(page, email, "Password123");
    await skipOnboarding(page);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("the seeded admin can reach /admin and sees real user counts", async ({ page }) => {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_EMAIL/PASSWORD not set");

    await page.goto("/login");
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Panel Admin")).toBeVisible();
    await expect(page.getByText("Total pengguna")).toBeVisible();
  });
});
