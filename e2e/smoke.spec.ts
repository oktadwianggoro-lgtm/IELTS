import { expect, test } from "@playwright/test";
import { registerAndLandOnDashboard } from "./helpers";

test("landing page shows the brand, CTA, and the required IELTS disclaimer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Success IELTS").first()).toBeVisible();
  await expect(page.getByText(/bukan penyelenggara atau mitra resmi IELTS/i)).toBeVisible();
});

test("primary CTA leads to login, then the dashboard shows honest empty states", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /mulai belajar gratis/i }).click();
  // Not signed in yet, so the CTA should land on login (with dashboard as the
  // post-login destination), not silently show a dashboard to a stranger.
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);

  await registerAndLandOnDashboard(page, "landing-cta");
  await expect(page.getByText(/belum ada rencana belajar/i)).toBeVisible();
  await expect(page.getByText(/belum ada progress/i)).toBeVisible();
});

test("a not-yet-built section honestly says so instead of faking content", async ({ page }) => {
  await registerAndLandOnDashboard(page, "coming-soon");
  // /tryout (Fase 11), /progress (Fase 12), and /info-ielts (Fase 14) are
  // all built now — /jalur-belajar is the next section still honestly
  // showing "Segera tersedia" rather than faked content. Its own
  // plannedPhase flag says "Fase 3" (stale — it was never actually built
  // then; this is a distinct "learning path" feature from /materi's
  // catalog, see Fase 12's investigation), so we only assert the honest
  // empty state itself, not a specific phase number.
  await page.goto("/jalur-belajar");
  await expect(page.getByText(/segera tersedia/i)).toBeVisible();
});

test("language toggle switches dashboard copy to English", async ({ page }) => {
  // The dashboard greets a named user with "Halo, {name}!" instead of the
  // dictionary's generic welcome title, so assert on body copy that stays
  // dictionary-driven regardless of personalization.
  await registerAndLandOnDashboard(page, "lang-toggle");
  await expect(page.getByText(/rencana hari ini/i)).toBeVisible();
  await page.getByRole("group", { name: "Bahasa" }).getByRole("button", { name: "EN" }).click();
  await expect(page.getByText(/today's plan/i)).toBeVisible();
});

test.describe("responsive navigation", () => {
  test("shows the sidebar on desktop viewports", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await registerAndLandOnDashboard(page, "nav-desktop");
    await expect(page.getByRole("navigation", { name: "Navigasi utama" }).first()).toBeVisible();
  });

  test("shows the bottom nav on mobile viewports", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await registerAndLandOnDashboard(page, "nav-mobile");
    await expect(page.getByRole("link", { name: /^Beranda$/ })).toBeVisible();
  });
});
