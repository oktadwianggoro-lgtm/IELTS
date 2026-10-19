import { expect, type Page } from "@playwright/test";

export function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function register(page: Page, email: string, password: string, name = "Siswa Uji") {
  await page.goto("/register");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Daftar" }).click();
}

export async function skipOnboarding(page: Page) {
  await page.getByRole("link", { name: "Lewati, isi nanti" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Clicks "Keluar" and waits for the resulting navigation to land on "/"
 * before returning. Sign-out does a hard reload rather than a soft
 * client-router push (D-035), so a caller that immediately issues its own
 * page.goto right after the click can race that reload and get
 * net::ERR_ABORTED — always await this instead of clicking directly.
 */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Registers a brand-new user, skips onboarding, and lands on /dashboard. */
export async function registerAndLandOnDashboard(page: Page, label: string) {
  const email = uniqueEmail(label);
  await register(page, email, "Password123");
  await expect(page).toHaveURL(/\/onboarding$/);
  await skipOnboarding(page);
  return email;
}
