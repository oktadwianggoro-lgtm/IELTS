import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { registerAndLandOnDashboard } from "./helpers";

/** Generically fills every question on the diagnostic page (exact correctness
 * isn't the point here — the sampling/grading/estimate round-trip is). */
async function fillAllQuestions(page: Page) {
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
}

test.describe("diagnostic test and study plan", () => {
  test("completing the diagnostic generates a result, a study plan, and surfaces on the dashboard", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "diagnostic-full-flow");

    await page.goto("/mulai-dari-sini");
    await expect(page.getByRole("heading", { name: "Mulai dari Sini" })).toBeVisible();

    // The start button's label depends on prior diagnostic state (none yet /
    // in progress / completed) — see app/(app)/mulai-dari-sini/page.tsx — so
    // match on the shared suffix rather than one exact label.
    await page.getByRole("button", { name: /Diagnostic Test$/i }).click();
    await page.waitForURL(/\/mulai-dari-sini\/diagnostic\/.+$/);
    await expect(page.getByText("Diagnostic Test", { exact: true })).toBeVisible();

    // The published question bank must be non-empty for this flow to mean
    // anything (regresses the Fase 5 bug where Question.reviewStatus never
    // cascaded from Lesson.reviewStatus and this always rendered 0/0 — see
    // docs/DECISIONS.md D-024).
    const progressText = page.getByText(/\d+ \/ \d+ pertanyaan terjawab/);
    await expect(progressText).toBeVisible();
    const progressMatch = (await progressText.textContent())!.match(/\d+ \/ (\d+) pertanyaan/);
    const totalQuestions = Number(progressMatch![1]);
    expect(totalQuestions).toBeGreaterThan(0);

    await fillAllQuestions(page);
    await expect(
      page.getByText(`${totalQuestions} / ${totalQuestions} pertanyaan terjawab`),
    ).toBeVisible();

    await page.getByRole("button", { name: "Lihat Hasil" }).click();
    await page.waitForURL(/\/hasil$/, { timeout: 15_000 });
    await expect(page.getByText("Hasil Diagnostic Test", { exact: true })).toBeVisible();
    await expect(page.getByText(/Estimasi level:/)).toBeVisible();
    await expect(page.getByText(/Keyakinan:/)).toBeVisible();
    await expect(page.getByText(/bukan penyelenggara/i)).toBeVisible();

    await page.getByRole("button", { name: /Buat Rencana Belajar Saya/i }).click();
    await page.waitForURL(/\/rencana-belajar$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Rencana Belajar" })).toBeVisible();

    const firstItemLink = page.locator('main a[href^="/materi/"]').first();
    const itemTitle = (await firstItemLink.textContent())!.trim();
    // Anchored on the lesson title (stable), not the Tandai/Selesai button
    // label (which changes on click and would make the locator stop
    // resolving once re-queried after the click).
    const itemRow = page.getByRole("link", { name: itemTitle }).locator("..").locator("..");

    await itemRow.getByRole("button", { name: "Tandai" }).click();
    await expect(itemRow.getByRole("button", { name: "Selesai" })).toBeVisible();

    // Persisted server-side, not just local state.
    await page.reload();
    await expect(page.getByText(itemTitle).first()).toBeVisible();
    await expect(itemRow.getByRole("button", { name: "Selesai" })).toBeVisible();

    // generateStudyPlan schedules starting today, so the dashboard's "today"
    // card should now show a real lesson instead of the empty-state copy.
    await page.goto("/dashboard");
    await expect(page.getByText("Rencana hari ini")).toBeVisible();
    await expect(page.getByText(itemTitle).first()).toBeVisible();
  });

  test("starting the diagnostic twice resumes the same in-progress result", async ({ page }) => {
    await registerAndLandOnDashboard(page, "diagnostic-resume");

    await page.goto("/mulai-dari-sini");
    await page.getByRole("button", { name: /Diagnostic Test$/i }).click();
    await page.waitForURL(/\/mulai-dari-sini\/diagnostic\/.+$/);
    const firstUrl = page.url();

    await page.goto("/mulai-dari-sini");
    await page.getByRole("button", { name: /Diagnostic Test$/i }).click();
    await page.waitForURL(/\/mulai-dari-sini\/diagnostic\/.+$/);
    expect(page.url()).toBe(firstUrl);
  });

  test("revisiting a completed diagnostic redirects straight to its results", async ({ page }) => {
    await registerAndLandOnDashboard(page, "diagnostic-completed-redirect");

    await page.goto("/mulai-dari-sini");
    await page.getByRole("button", { name: /Diagnostic Test$/i }).click();
    await page.waitForURL(/\/mulai-dari-sini\/diagnostic\/[^/]+$/);
    const resultId = page.url().split("/").pop()!;

    await fillAllQuestions(page);
    await page.getByRole("button", { name: "Lihat Hasil" }).click();
    await page.waitForURL(/\/hasil$/, { timeout: 15_000 });

    await page.goto(`/mulai-dari-sini/diagnostic/${resultId}`);
    await page.waitForURL(/\/hasil$/);
    await expect(page.getByText("Hasil Diagnostic Test", { exact: true })).toBeVisible();
  });
});
