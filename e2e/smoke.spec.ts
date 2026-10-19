import { expect, test } from "@playwright/test";

test("landing page shows the brand, CTA, and the required IELTS disclaimer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Success IELTS").first()).toBeVisible();
  await expect(page.getByText(/bukan penyelenggara atau mitra resmi IELTS/i)).toBeVisible();
});

test("primary CTA navigates to the dashboard with honest empty states", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /mulai belajar gratis/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/belum ada rencana belajar/i)).toBeVisible();
  await expect(page.getByText(/belum ada progress/i)).toBeVisible();
});

test("a not-yet-built section honestly says so instead of faking content", async ({ page }) => {
  await page.goto("/tryout");
  await expect(page.getByText(/segera tersedia/i)).toBeVisible();
  await expect(page.getByText(/fase 11/i)).toBeVisible();
});

test("language toggle switches dashboard copy to English", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("group", { name: "Bahasa" }).getByRole("button", { name: "EN" }).click();
  await expect(page.getByText(/welcome to success ielts/i)).toBeVisible();
});

test.describe("responsive navigation", () => {
  test("shows the sidebar on desktop viewports", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Navigasi utama" }).first()).toBeVisible();
  });

  test("shows the bottom nav on mobile viewports", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /^Beranda$/ })).toBeVisible();
  });
});
