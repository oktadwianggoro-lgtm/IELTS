import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// A phrase that only exists in READING-AC-001's evidence quotes — used to
// assert evidence never reaches the client before it should (D-021/D-034:
// answer-adjacent content must never leak pre-submission).
const AC_EVIDENCE_PHRASE = "Bukti:";

test.beforeAll(async () => {
  // Deterministic starting state regardless of what earlier runs left
  // behind — same rationale as materi-catalog.spec.ts's beforeAll.
  for (const code of ["READING-AC-001", "READING-GT-001"]) {
    const passage = await prisma.readingPassage.update({
      where: { code },
      data: { reviewStatus: "PUBLISHED" },
    });
    await prisma.question.updateMany({
      where: { readingPassageId: passage.id },
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

test.describe("Reading Lab", () => {
  test("the catalog lists published passages under their exam type", async ({ page }) => {
    await registerAndLandOnDashboard(page, "reading-catalog");
    await page.goto("/reading-lab");

    const main = page.locator("main");
    await expect(main.getByText("The Rise of Urban Beekeeping")).toBeVisible();
    await expect(main.getByText("Greenfield Office — Recycling and Waste Policy")).toBeVisible();
  });

  test("never leaks evidence before checking, reveals it after, and logs attempts", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "reading-practice");

    await page.goto("/reading-lab/READING-AC-001");
    await expect(
      page.getByText("The Rise of Urban Beekeeping", { exact: true }).first(),
    ).toBeVisible();

    const htmlBeforeCheck = await page.content();
    expect(htmlBeforeCheck).not.toContain(AC_EVIDENCE_PHRASE);

    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText(AC_EVIDENCE_PHRASE).first()).toBeVisible();

    const htmlAfterCheck = await page.content();
    expect(htmlAfterCheck).toContain(AC_EVIDENCE_PHRASE);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId: user.id, source: "READING_PRACTICE" },
    });
    expect(attempts.length).toBeGreaterThanOrEqual(5);
  });

  test("shows a live word-count warning once a free-text answer exceeds its word limit", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "reading-word-limit");

    await page.goto("/reading-lab/READING-GT-001");
    await expect(
      page.getByText("Greenfield Office — Recycling and Waste Policy", { exact: true }).first(),
    ).toBeVisible();

    // Q4 has wordLimit: 1 ("Which colour bin is used for paper and cardboard?").
    const q4Input = page.getByPlaceholder("Jawaban Anda").first();
    await q4Input.fill("blue");
    await expect(page.getByText("1 / 1 kata")).toBeVisible();
    await expect(page.getByText(/melebihi batas kata/)).not.toBeVisible();

    await q4Input.fill("the colour blue");
    await expect(page.getByText(/melebihi batas kata/)).toBeVisible();
  });

  test("flagging a question marks it in the navigator", async ({ page }) => {
    await registerAndLandOnDashboard(page, "reading-flag");

    await page.goto("/reading-lab/READING-AC-001");
    await expect(
      page.getByText("The Rise of Urban Beekeeping", { exact: true }).first(),
    ).toBeVisible();

    const flagButtons = page.getByRole("button", { name: "Tandai untuk ditinjau" });
    await expect(flagButtons.first()).toBeVisible();
    await flagButtons.first().click();

    // The navigator's first button should now render a flag marker.
    const navigatorFirstButton = page.getByRole("button", { name: /Ke soal 1 \(ditandai\)/ });
    await expect(navigatorFirstButton).toBeVisible();
  });

  test("a wrong reading answer is added to the Buku Kesalahan", async ({ page }) => {
    const email = await registerAndLandOnDashboard(page, "reading-mistake-book");

    await page.goto("/reading-lab/READING-AC-001");
    // "test answer"/first-radio-option is guaranteed wrong for most
    // questions here, so at least one mistake-book entry must be created.
    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText(AC_EVIDENCE_PHRASE).first()).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const mistakes = await prisma.mistakeBookEntry.count({ where: { userId: user.id } });
    expect(mistakes).toBeGreaterThan(0);
  });
});
