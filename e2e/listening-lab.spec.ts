import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// A phrase that only exists in LISTENING-S1-001's transcript — used to
// assert the transcript never reaches the client before it should
// (D-021/D-031: answer-adjacent content must never leak pre-submission).
const S1_TRANSCRIPT_PHRASE = "Riverside Public Library";
const S3_TRANSCRIPT_PHRASE = "renewable energy";

test.beforeAll(async () => {
  // Deterministic starting state regardless of what earlier runs left
  // behind — same rationale as materi-catalog.spec.ts's beforeAll.
  for (const code of ["LISTENING-S1-001", "LISTENING-S3-001"]) {
    const passage = await prisma.listeningPassage.update({
      where: { code },
      data: { reviewStatus: "PUBLISHED" },
    });
    await prisma.question.updateMany({
      where: { listeningPassageId: passage.id },
      data: { reviewStatus: "PUBLISHED" },
    });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function fillAllQuestions(page: Page) {
  const radioGroups = page.locator('[role="radiogroup"]');
  const count = await radioGroups.count();
  for (let i = 0; i < count; i++) {
    await radioGroups.nth(i).locator('[role="radio"]').first().click();
  }
  const textInputs = page.locator("input[placeholder]");
  const tiCount = await textInputs.count();
  for (let i = 0; i < tiCount; i++) {
    await textInputs.nth(i).fill("test answer");
  }
}

test.describe("Listening Lab", () => {
  test("the catalog lists published passages by section and honestly flags empty sections", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "listening-catalog");
    await page.goto("/listening-lab");

    const main = page.locator("main");
    await expect(main.getByText("Joining Riverside Library")).toBeVisible();
    await expect(main.getByText("Planning a Renewable Energy Presentation")).toBeVisible();
    // Section 2 and 4 have no seeded content yet — must say so honestly,
    // not silently omit the section or show a fake "coming soon" badge.
    await expect(main.getByText("Segera tersedia")).toHaveCount(2);
  });

  test("practice mode never leaks the transcript before checking, reveals it after, and logs attempts", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "listening-practice");

    await page.goto("/listening-lab/LISTENING-S1-001");
    await expect(
      page.getByText("Joining Riverside Library", { exact: true }).first(),
    ).toBeVisible();

    const htmlBeforeCheck = await page.content();
    expect(htmlBeforeCheck).not.toContain(S1_TRANSCRIPT_PHRASE);

    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText("Transkrip", { exact: true })).toBeVisible();

    const htmlAfterCheck = await page.content();
    expect(htmlAfterCheck).toContain(S1_TRANSCRIPT_PHRASE);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId: user.id, source: "LISTENING_PRACTICE" },
    });
    expect(attempts.length).toBeGreaterThanOrEqual(5);
  });

  test("exam mode allows exactly one playback and withholds the transcript even after checking", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "listening-exam-mode");

    await page.goto("/listening-lab/LISTENING-S3-001");
    await expect(
      page.getByText("Planning a Renewable Energy Presentation", { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mode Ujian" }).click();

    const playBtn = page.getByRole("button", { name: "Putar Audio (satu kali)" });
    await expect(playBtn).toBeEnabled();
    await playBtn.click();
    await expect(page.getByRole("button", { name: "Audio sudah diputar" })).toBeDisabled();

    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText(/\d+ \/ \d+ benar/)).toBeVisible();

    await expect(page.getByText("Transkrip", { exact: true })).not.toBeVisible();
    const html = await page.content();
    expect(html).not.toContain(S3_TRANSCRIPT_PHRASE);
  });

  test("a wrong listening answer is added to the Buku Kesalahan", async ({ page }) => {
    const email = await registerAndLandOnDashboard(page, "listening-mistake-book");

    await page.goto("/listening-lab/LISTENING-S1-001");
    // "test answer" is guaranteed wrong for every short-answer/gap-fill
    // question here, so at least one mistake-book entry must be created.
    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText("Transkrip", { exact: true })).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const mistakes = await prisma.mistakeBookEntry.count({ where: { userId: user.id } });
    expect(mistakes).toBeGreaterThan(0);
  });
});
