import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Answers whatever practice/review card is currently showing, generically
 * (exact correctness isn't the point — the engine's wiring is).
 *
 * Waits for *some* question UI first before branching on which specific
 * shape it is. Each one-card-at-a-time flow (practice session, mistake
 * review) remounts a fresh card right after this runs for the previous one
 * — branching straight off three independent, non-retrying `.isVisible()`
 * checks could run a beat before React commits the next card, see none of
 * them, and fall through to `.fill("Jawaban Anda")`, which then retries
 * against the wrong selector for up to 30s if the real next card turns out
 * to be a radiogroup or ORDERING input. */
async function fillCurrentCard(page: Page) {
  await page
    .locator('[role="radiogroup"], input[placeholder]')
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });

  const radioGroup = page.locator('[role="radiogroup"]').first();
  if (await radioGroup.isVisible().catch(() => false)) {
    await radioGroup.locator('[role="radio"]').first().click();
    return;
  }
  const orderingInput = page.getByPlaceholder(/Tulis urutan/i);
  if (await orderingInput.isVisible().catch(() => false)) {
    await orderingInput.fill("A, B, C, D");
    return;
  }
  await page.getByPlaceholder("Jawaban Anda").fill("test answer");
}

/** Runs one full adaptive practice session to completion, submitting a
 * generic answer for every card. Returns how many cards were answered. */
async function runPracticeSessionToCompletion(page: Page): Promise<number> {
  let count = 0;
  const MAX = 30;
  while (count < MAX) {
    if (
      await page
        .getByText("Sesi latihan selesai", { exact: true })
        .isVisible()
        .catch(() => false)
    )
      break;
    count++;
    await fillCurrentCard(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    const nextBtn = page.getByRole("button", { name: /Lanjut|Lihat Ringkasan/ });
    await nextBtn.waitFor({ state: "visible", timeout: 10_000 });
    await nextBtn.click();
  }
  await page.getByText("Sesi latihan selesai", { exact: true }).waitFor({ state: "visible" });
  return count;
}

test.describe("adaptive practice engine", () => {
  test("a full practice session grades every card, tracks time, and routes wrong answers into the Buku Kesalahan", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "practice-full-flow");

    await page.goto("/latihan-harian");
    await expect(page.getByRole("heading", { name: "Latihan Harian" })).toBeVisible();

    const answered = await runPracticeSessionToCompletion(page);
    expect(answered).toBeGreaterThan(0);
    await expect(page.getByText(new RegExp(`\\d+ / ${answered} jawaban benar`))).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId: user.id, source: "ADAPTIVE_PRACTICE" },
    });
    // One attempt per card, every one with a real (non-negative) timing
    // value — regresses silently-dropped or unlogged submissions.
    expect(attempts).toHaveLength(answered);
    for (const a of attempts) expect(a.timeSpentMs).toBeGreaterThanOrEqual(0);

    const wrongAttempts = attempts.filter((a) => !a.correct);
    const mistakes = await prisma.mistakeBookEntry.findMany({ where: { userId: user.id } });
    // Every distinct wrong question becomes exactly one mistake-book entry
    // (upsert, not a duplicate row per miss).
    expect(mistakes).toHaveLength(new Set(wrongAttempts.map((a) => a.questionId)).size);

    if (mistakes.length > 0) {
      await page.goto("/buku-kesalahan");
      await expect(
        page.getByText(`${mistakes.length} total soal tersimpan`, { exact: false }),
      ).toBeVisible();
    }
  });
});

test.describe("Buku Kesalahan (mistake book) review", () => {
  test("reviewing every due card updates all of them — none are silently skipped", async ({
    page,
  }) => {
    // Reviewing 10-15 cards back-to-back is slower than the default 30s
    // budget — see docs/DECISIONS.md D-032 for the real bug this test
    // caught (rating the last due card used to swap the whole review
    // session out for the page's empty state, destroying the completion
    // screen) and its fix.
    test.setTimeout(60_000);
    const email = await registerAndLandOnDashboard(page, "mistake-review-no-skip");

    await page.goto("/latihan-harian");
    await runPracticeSessionToCompletion(page);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const dueBefore = await prisma.mistakeBookEntry.findMany({
      where: { userId: user.id, nextReviewAt: { lte: new Date() } },
    });
    test.skip(dueBefore.length === 0, "practice session happened to get everything right");

    await page.goto("/buku-kesalahan");
    await expect(page.getByRole("heading", { name: "Buku Kesalahan" })).toBeVisible();

    // Regresses a bug where `rateMistakeReviewAction`'s revalidatePath
    // shrank the due list the component reads from while a plain numeric
    // index kept advancing — silently skipping the next card each time
    // (docs/DECISIONS.md D-028).
    let reviewed = 0;
    const cap = dueBefore.length + 3;
    while (reviewed < cap) {
      // Advancing a review card awaits `rateMistakeReviewAction` (a real
      // network round-trip) before the next card or the "Review selesai"
      // screen renders — an instant, non-retrying `.isVisible()` check here
      // could run inside that gap and see neither, breaking the loop one
      // card early, same bug class as the ORDERING-placeholder miss this
      // loop used to have (see fillCurrentCard's comment). Race two native
      // `waitFor`s (DOM-mutation-aware, unlike a manual isVisible() poll)
      // instead of a single `.or()` check so a false negative at any one
      // instant doesn't end the loop.
      const questionUi = page.locator('[role="radiogroup"], input[placeholder]').first();
      const doneScreen = page.getByText("Review selesai", { exact: true });
      const settled = await Promise.race([
        questionUi.waitFor({ state: "visible", timeout: 15_000 }).then(() => "question" as const),
        doneScreen.waitFor({ state: "visible", timeout: 15_000 }).then(() => "done" as const),
      ]).catch(() => null);
      if (settled === null) {
        throw new Error("Neither a question card nor the done screen appeared within 15s");
      }
      if (settled === "done") break;

      await fillCurrentCard(page);
      await page.getByRole("button", { name: "Periksa Jawaban" }).click();
      await page
        .getByText("Jawaban yang diharapkan:")
        .waitFor({ state: "visible", timeout: 10_000 });
      await page
        .getByRole("button", { name: /Mudah|Lanjut/ })
        .first()
        .click();
      reviewed++;
      await page.waitForTimeout(150);
    }

    expect(reviewed).toBe(dueBefore.length);

    const after = await prisma.mistakeBookEntry.findMany({
      where: { id: { in: dueBefore.map((e) => e.id) } },
    });
    for (const entry of after) {
      expect(entry.reviewCount).toBeGreaterThanOrEqual(1);
      expect(entry.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
    }
  });

  test("a correct review offers a difficulty rating; an incorrect one does not", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "mistake-review-rating-buttons");

    await page.goto("/latihan-harian");
    await runPracticeSessionToCompletion(page);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const due = await prisma.mistakeBookEntry.findFirst({
      where: { userId: user.id, nextReviewAt: { lte: new Date() } },
      include: { question: true },
    });
    test.skip(!due, "no due mistakes to review from this session");

    await page.goto("/buku-kesalahan");
    await fillCurrentCard(page);
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await page.getByText("Jawaban yang diharapkan:").waitFor({ state: "visible" });

    const hasEasy = await page
      .getByRole("button", { name: "Mudah" })
      .isVisible()
      .catch(() => false);
    const hasLanjut = await page
      .getByRole("button", { name: "Lanjut" })
      .isVisible()
      .catch(() => false);
    // Exactly one of the two paths is offered, never both.
    expect(hasEasy !== hasLanjut).toBe(true);
  });
});
