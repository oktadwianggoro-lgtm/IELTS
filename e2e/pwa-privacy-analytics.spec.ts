import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard, uniqueEmail, register, skipOnboarding } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("PWA", () => {
  test("manifest.webmanifest is served anonymously with installable fields and real icons", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.name).toBe("Success IELTS");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);

    const iconRes = await request.get(manifest.icons[0].src);
    expect(iconRes.ok()).toBe(true);
    expect(iconRes.headers()["content-type"]).toContain("image/png");
  });

  test("the service worker script and offline fallback are reachable without logging in", async ({
    page,
    request,
  }) => {
    const swRes = await request.get("/sw.js");
    expect(swRes.ok()).toBe(true);

    await page.goto("/offline");
    await expect(page).toHaveURL(/\/offline$/);
    await expect(page.getByText(/sedang offline/i)).toBeVisible();
  });
});

test.describe("Privacy page", () => {
  test("is reachable without logging in and explains data collection and user rights", async ({
    page,
  }) => {
    await page.goto("/privasi");
    await expect(page).toHaveURL(/\/privasi$/);
    await expect(page.getByText(/bukan penyelenggara atau mitra resmi IELTS/i).first()).toBeVisible();
    await expect(page.getByText(/Analitik penggunaan/).first()).toBeVisible();
    await expect(page.getByText(/Hapus Akun/i).first()).toBeVisible();
  });
});

test.describe("Account data controls", () => {
  test("the analytics opt-out toggle persists after a reload", async ({ page }) => {
    await registerAndLandOnDashboard(page, "analytics-optout");
    await page.goto("/profil");

    const toggle = page.getByRole("switch", { name: "Analitik penggunaan" });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await page.getByRole("button", { name: "Simpan Preferensi" }).click();
    await expect(page.getByText("Preferensi tersimpan.")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("switch", { name: "Analitik penggunaan" })).not.toBeChecked();
  });

  test("deleting the account removes the user row and signs them out", async ({ page }) => {
    const email = await registerAndLandOnDashboard(page, "delete-account");
    await page.goto("/profil");

    await page.getByRole("button", { name: "Hapus Akun" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Hapus Akun Permanen" }).click();

    await expect(page).toHaveURL(/\/$/);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });
});

test.describe("Admin analytics", () => {
  test("is ADMIN-only and shows real, non-fabricated counts", async ({ page }) => {
    const email = uniqueEmail("admin-analytics");
    await register(page, email, "Password123");
    await expect(page).toHaveURL(/\/onboarding$/);
    await skipOnboarding(page);
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });

    // Role takes effect on next sign-in.
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/admin/analytics");
    await expect(page).toHaveURL(/\/admin\/analytics$/);
    await expect(page.getByText("Total kunjungan halaman")).toBeVisible();
    await expect(page.getByText("Pengunjung unik (anonim)")).toBeVisible();
  });
});
