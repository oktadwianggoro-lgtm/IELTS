import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.beforeAll(async () => {
  for (const code of [
    "MOCKTEST-LISTENING-MINI-001",
    "MOCKTEST-READING-ACADEMIC-001",
    "MOCKTEST-READING-GT-001",
  ]) {
    await prisma.mockTest.update({ where: { code }, data: { reviewStatus: "PUBLISHED" } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function answerAllQuestions(page: import("@playwright/test").Page) {
  const main = page.locator("main");
  for (const inp of await main.locator('input:not([type="radio"])').all()) {
    await inp.fill("test answer");
  }
  for (const group of await main.locator('[role="radiogroup"]').all()) {
    await group.locator('[role="radio"]').first().click();
  }
}

test.describe("Tryout", () => {
  test("the catalog lists published mock tests", async ({ page }) => {
    await registerAndLandOnDashboard(page, "tryout-catalog");
    await page.goto("/tryout");

    const main = page.locator("main");
    await expect(main.getByText("Listening Mini Mock")).toBeVisible();
    await expect(main.getByText("Academic Reading Section Test")).toBeVisible();
    await expect(main.getByText("General Training Reading Section Test")).toBeVisible();
  });

  test("answers and a flag survive a reload, with the countdown resuming (not resetting)", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "tryout-resume");

    await page.goto("/tryout/MOCKTEST-READING-ACADEMIC-001");
    await page.getByRole("button", { name: "Mulai Tryout" }).click();
    await expect(page.getByText("terjawab")).toBeVisible({ timeout: 10_000 });

    await answerAllQuestions(page);
    await expect(page.getByText("9 / 9 terjawab")).toBeVisible();

    await page.getByLabel("Tandai untuk ditinjau").first().click();
    // Let the 800ms debounced autosave land before reloading.
    await page.waitForTimeout(2000);

    const timerBefore = await page.locator("text=/\\d{1,2}:\\d{2}/").first().textContent();

    await page.reload();
    await expect(page.getByText("9 / 9 terjawab")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Ke soal 1/ })).toHaveClass(/border-brand-amber/);

    const timerAfter = await page.locator("text=/\\d{1,2}:\\d{2}/").first().textContent();
    // The countdown must have kept running server-side, not reset to the
    // full duration — this is what proves deadlineAt (not a client-local
    // timer) is the source of truth.
    expect(timerAfter).not.toBe("20:00");
    expect(timerBefore).not.toBe("20:00");
  });

  test("submitting shows raw score, accuracy by question type, and routes wrong answers into Buku Kesalahan", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "tryout-submit");

    await page.goto("/tryout/MOCKTEST-READING-GT-001");
    await page.getByRole("button", { name: "Mulai Tryout" }).click();
    await expect(page.getByText("terjawab")).toBeVisible({ timeout: 10_000 });

    await answerAllQuestions(page);
    await page.getByRole("button", { name: "Selesai & Submit" }).click();
    await expect(page.getByText("Hasil", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Raw score", { exact: true })).toBeVisible();
    await expect(page.getByText("Akurasi per Tipe Soal")).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempt = await prisma.attempt.findFirstOrThrow({ where: { userId: user.id } });
    expect(["SUBMITTED", "AUTO_SUBMITTED"]).toContain(attempt.status);
    expect(attempt.result).not.toBeNull();

    const mistakeCount = await prisma.mistakeBookEntry.count({ where: { userId: user.id } });
    expect(mistakeCount).toBeGreaterThan(0);

    const trialAttempts = await prisma.questionAttempt.count({
      where: { userId: user.id, source: "TRYOUT" },
    });
    expect(trialAttempts).toBeGreaterThan(0);
  });

  test("auto-submits once the server-side deadline has passed, even without the client's own timer firing", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "tryout-autosubmit");

    await page.goto("/tryout/MOCKTEST-READING-ACADEMIC-001");
    await page.getByRole("button", { name: "Mulai Tryout" }).click();
    await expect(page.getByText("terjawab")).toBeVisible({ timeout: 10_000 });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempt = await prisma.attempt.findFirstOrThrow({ where: { userId: user.id } });
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { deadlineAt: new Date(Date.now() - 5000) },
    });

    // Reload re-fetches attempt state, which finalizes an expired
    // IN_PROGRESS attempt server-side before returning it — the client
    // never has to "notice" the expiry itself.
    await page.reload();
    await expect(page.getByText("Hasil", { exact: true })).toBeVisible({ timeout: 10_000 });

    const finalized = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(finalized.status).toBe("AUTO_SUBMITTED");
  });

  test("'Coba Lagi' starts a brand new attempt", async ({ page }) => {
    const email = await registerAndLandOnDashboard(page, "tryout-retry");

    await page.goto("/tryout/MOCKTEST-READING-GT-001");
    await page.getByRole("button", { name: "Mulai Tryout" }).click();
    await expect(page.getByText("terjawab")).toBeVisible({ timeout: 10_000 });
    await answerAllQuestions(page);
    await page.getByRole("button", { name: "Selesai & Submit" }).click();
    await expect(page.getByText("Hasil", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Coba Lagi" }).click();
    await expect(page.getByText("0 / 7 terjawab")).toBeVisible({ timeout: 10_000 });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempts = await prisma.attempt.findMany({ where: { userId: user.id } });
    expect(attempts).toHaveLength(2);
    expect(attempts.filter((a) => a.status === "IN_PROGRESS")).toHaveLength(1);
  });
});
