import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.beforeAll(async () => {
  // Deterministic starting state regardless of what earlier test runs left
  // behind: the catalog/lesson-taking flow only matters once the lesson is
  // actually published, which is a separate concern already covered by
  // content-cms.spec.ts's editorial-workflow test.
  await prisma.lesson.update({
    where: { code: "STARTER-GRAM-001" },
    data: { reviewStatus: "PUBLISHED" },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("materi catalog and lesson page", () => {
  test("browsing from the top catalog down to a published lesson", async ({ page }) => {
    await registerAndLandOnDashboard(page, "catalog-browse");

    // Scoped to <main> throughout: the sidebar nav has its own "Grammar &
    // Vocabulary" / "Listening Lab" items whose text otherwise collides with
    // catalog card titles like "Grammar" / "Listening".
    const main = page.locator("main");

    await page.goto("/materi");
    await expect(page.getByRole("heading", { name: "Materi" })).toBeVisible();
    await expect(main.getByText("Starter / Pre-A1")).toBeVisible();
    await expect(main.getByText("Grammar Lab")).toBeVisible(); // a special track with no lessons yet

    await main.getByText("Starter / Pre-A1").first().click();
    await expect(page).toHaveURL(/\/materi\/PATH-STARTER$/);
    await expect(main.getByText("Grammar", { exact: true })).toBeVisible();
    await expect(main.getByText("Listening", { exact: true })).toBeVisible();

    // A skill module with no published lessons says so honestly.
    await page.goto("/materi/PATH-STARTER/STARTER-LISTENING");
    await expect(page.getByText(/segera tersedia/i)).toBeVisible();

    await page.goto("/materi/PATH-STARTER/STARTER-FOUNDATIONS");
    await expect(page.getByText(/Alphabet dan Spelling/i)).toBeVisible();
    await expect(page.getByText(/5 soal/i)).toBeVisible();
  });

  test("a non-published lesson 404s for a student even with a guessed URL", async ({ page }) => {
    await registerAndLandOnDashboard(page, "catalog-guess");
    await page.goto("/materi/PATH-A1/A1-GRAMMAR/A1-GRAMMAR-999-DOES-NOT-EXIST");
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible();
  });

  test("taking the lesson: quiz grading, bookmark, note, and mark complete all work", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "take-lesson");

    await page.goto("/materi/PATH-STARTER/STARTER-FOUNDATIONS/STARTER-GRAM-001");
    await expect(page.getByRole("heading", { name: /Alphabet dan Spelling/i })).toBeVisible();

    // Fill every question generically (exact correctness isn't the point of
    // this test — the grading round-trip and UI feedback are).
    const radioGroups = page.locator('[role="radiogroup"]');
    const radioGroupCount = await radioGroups.count();
    for (let i = 0; i < radioGroupCount; i++) {
      await radioGroups.nth(i).locator('[role="radio"]').first().click();
    }
    const orderingInput = page.getByPlaceholder(/Tulis urutan/i);
    if (await orderingInput.isVisible().catch(() => false)) {
      await orderingInput.fill("A, B, C, D");
    }
    const freeTextInputs = page.getByPlaceholder("Jawaban Anda");
    const freeTextCount = await freeTextInputs.count();
    for (let i = 0; i < freeTextCount; i++) {
      await freeTextInputs.nth(i).fill("placeholder answer");
    }

    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await expect(page.getByText(/\/ 5 benar/)).toBeVisible();

    // Bookmark
    await page.getByRole("button", { name: /^Simpan$/ }).click();
    await expect(page.getByRole("button", { name: /Tersimpan/ })).toBeVisible();

    // Note
    await page.getByLabel(/Catatan pribadi/i).fill("Catatan uji coba E2E");
    await page.getByLabel(/Catatan pribadi/i).blur();
    await expect(page.getByText("Tersimpan").last()).toBeVisible();

    // Mark complete
    await page.getByRole("button", { name: /Tandai Selesai/i }).click();
    await expect(page.getByRole("button", { name: /^Selesai$/ })).toBeVisible();

    // Reload to confirm all three persisted server-side, not just local state.
    await page.reload();
    await expect(page.getByRole("button", { name: /Tersimpan/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Selesai$/ })).toBeVisible();
    await expect(page.getByLabel(/Catatan pribadi/i)).toHaveValue("Catatan uji coba E2E");
  });
});
