import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.beforeAll(async () => {
  await prisma.writingTask.update({
    where: { code: "WRITING-TASK1-AC-001" },
    data: { reviewStatus: "PUBLISHED" },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Dashboard gamification", () => {
  test("a brand-new user sees honest empty states, not fabricated stats", async ({ page }) => {
    await registerAndLandOnDashboard(page, "gamify-empty");

    const main = page.locator("main");
    await expect(main.getByText("0 hari", { exact: true })).toBeVisible();
    await expect(main.getByText("Level 1")).toBeVisible();
    await expect(main.getByText("0 / 100 XP menuju level 2")).toBeVisible();
    await expect(main.getByText(/belum ada rencana belajar aktif/i)).toBeVisible();

    // None of the 7 achievements should be visually "earned" yet.
    const earnedBadges = page.locator(".border-brand-teal.bg-brand-teal\\/10");
    await expect(earnedBadges).toHaveCount(0);
  });

  test("completing a real Writing submission awards XP and the matching achievement, both reflected on the dashboard", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "gamify-writing");

    await page.goto("/writing-lab/WRITING-TASK1-AC-001");
    await page.getByRole("button", { name: "Mulai Menulis" }).click();
    await page
      .locator("textarea")
      .nth(1)
      .fill("A real test answer long enough to submit for gamification verification.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    await page.goto("/dashboard");
    const main = page.locator("main");
    await expect(main.getByText(/Submit Writing/)).toBeVisible();
    await expect(main.getByText("Penulis Pemula")).toBeVisible();
    // 1 Writing submission = 15 XP per lib/gamification/xp.ts.
    await expect(main.getByText("15 / 100 XP menuju level 2")).toBeVisible();
  });

  test("a due Buku Kesalahan review shows a real, data-backed banner that respects the user's preference toggle", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "gamify-review-banner");
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    const question = await prisma.question.findFirstOrThrow({
      where: { reviewStatus: "PUBLISHED" },
    });
    await prisma.mistakeBookEntry.create({
      data: {
        userId: user.id,
        questionId: question.id,
        lastSubmittedAnswer: "wrong",
        nextReviewAt: new Date(Date.now() - 60_000),
      },
    });

    await page.goto("/dashboard");
    await expect(page.getByText(/1 soal di Buku Kesalahan siap direview/)).toBeVisible();

    // Turn the preference off and confirm the banner disappears on next visit.
    await page.goto("/profil");
    await page.getByRole("switch", { name: "Pengingat review Buku Kesalahan" }).click();
    await page.getByRole("button", { name: "Simpan Preferensi" }).click();
    await expect(page.getByText("Preferensi tersimpan.")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(/soal di Buku Kesalahan siap direview/)).toHaveCount(0);
  });

  test("opting into the leaderboard with an alias makes it appear on /progress; never the user's real name or email", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "gamify-leaderboard");
    // Unique per run, same reason uniqueEmail() exists — a hardcoded alias
    // would collide with leftover rows from earlier runs of this same test
    // in the shared dev database.
    const alias = `Rubah Cepat ${Date.now()}`;

    await page.goto("/profil");
    await page.getByRole("switch", { name: "Ikut leaderboard" }).click();
    await page.getByLabel("Nama samaran").fill(alias);
    await page.getByRole("button", { name: "Simpan Preferensi" }).click();
    await expect(page.getByText("Preferensi tersimpan.")).toBeVisible();

    await page.goto("/progress");
    await expect(page.getByText(alias)).toBeVisible();
    await expect(page.getByText(email)).toHaveCount(0);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const pref = await prisma.userPreference.findUniqueOrThrow({ where: { userId: user.id } });
    expect(pref.leaderboardOptIn).toBe(true);
    expect(pref.leaderboardAlias).toBe(alias);
  });
});
