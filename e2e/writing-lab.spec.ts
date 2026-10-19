import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// A phrase that only exists in WRITING-TASK1-AC-001's sample answer — used
// to assert it never reaches the client before it should (D-021-style:
// answer-adjacent content must never leak pre-submission).
const SAMPLE_ANSWER_PHRASE = "the proportion of households with internet access";

test.beforeAll(async () => {
  for (const code of ["WRITING-TASK1-AC-001", "WRITING-TASK1-GT-001", "WRITING-TASK2-001"]) {
    await prisma.writingTask.update({ where: { code }, data: { reviewStatus: "PUBLISHED" } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Writing Lab", () => {
  test("the catalog lists published tasks under their task type", async ({ page }) => {
    await registerAndLandOnDashboard(page, "writing-catalog");
    await page.goto("/writing-lab");

    const main = page.locator("main");
    await expect(main.getByText("Internet Access in Four Countries")).toBeVisible();
    await expect(
      main.getByText("Complaint Letter About a Late and Damaged Delivery"),
    ).toBeVisible();
    await expect(
      main.getByText("Remote Work: Permanent Home-Working vs. Full-Time Office Return"),
    ).toBeVisible();
  });

  test("never leaks the sample answer before submitting, reveals it after, and tracks word count", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "writing-practice");

    await page.goto("/writing-lab/WRITING-TASK1-AC-001");
    await expect(
      page.getByText("Internet Access in Four Countries", { exact: false }).first(),
    ).toBeVisible();

    const htmlBeforeStart = await page.content();
    expect(htmlBeforeStart).not.toContain(SAMPLE_ANSWER_PHRASE);

    await page.getByRole("button", { name: "Mulai Menulis" }).click();
    await expect(page.getByText("Brainstorm / Outline", { exact: false })).toBeVisible();

    const htmlAfterStart = await page.content();
    expect(htmlAfterStart).not.toContain(SAMPLE_ANSWER_PHRASE);

    const body = page.locator("textarea").nth(1);
    const text =
      "This is my test answer about internet access trends across four countries over time.";
    await body.fill(text);
    await expect(page.getByText(`${text.trim().split(/\s+/).length} / 150 kata`)).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible();

    const htmlAfterSubmit = await page.content();
    expect(htmlAfterSubmit).toContain(SAMPLE_ANSWER_PHRASE);

    const expectedWords = text.trim().split(/\s+/).length;
    await expect(page.getByText(`Jawaban Anda (${expectedWords} kata)`)).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const submission = await prisma.writingSubmission.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(submission.status).toBe("SUBMITTED");
    expect(submission.wordCount).toBe(expectedWords);
  });

  test("shows an under-minimum word count warning but does not block submission", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "writing-under-minimum");

    await page.goto("/writing-lab/WRITING-TASK2-001");
    await page.getByRole("button", { name: "Mulai Menulis" }).click();
    await expect(page.getByText("Brainstorm / Outline", { exact: false })).toBeVisible();

    const body = page.locator("textarea").nth(1);
    await body.fill("A short answer under the 250 word minimum.");
    await expect(page.getByText(/di bawah jumlah kata minimum/)).toBeVisible();

    const submitBtn = page.getByRole("button", { name: "Submit" });
    await expect(submitBtn).toBeEnabled();
  });

  test("self-assessment checkbox state persists after a reload", async ({ page }) => {
    await registerAndLandOnDashboard(page, "writing-self-assessment");

    await page.goto("/writing-lab/WRITING-TASK1-GT-001");
    await page.getByRole("button", { name: "Mulai Menulis" }).click();
    await expect(page.getByText("Brainstorm / Outline", { exact: false })).toBeVisible();

    const body = page.locator("textarea").nth(1);
    await body.fill("Dear Sir or Madam, I am writing to report a problem with my recent order.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible();

    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-checked", "");

    await page.reload();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox").first()).toHaveAttribute("data-checked", "");
  });

  test("'Tulis Lagi' starts a brand new attempt", async ({ page }) => {
    const email = await registerAndLandOnDashboard(page, "writing-retry");

    await page.goto("/writing-lab/WRITING-TASK2-001");
    await page.getByRole("button", { name: "Mulai Menulis" }).click();
    await expect(page.getByText("Brainstorm / Outline", { exact: false })).toBeVisible();
    await page.locator("textarea").nth(1).fill("First attempt text for this essay task.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tulis Lagi" }).click();
    await expect(page.getByText("Brainstorm / Outline", { exact: false })).toBeVisible();
    await expect(page.locator("textarea").nth(1)).toHaveValue("");

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const submissions = await prisma.writingSubmission.findMany({ where: { userId: user.id } });
    expect(submissions).toHaveLength(2);
    expect(submissions.filter((s) => s.status === "SUBMITTED")).toHaveLength(1);
    expect(submissions.filter((s) => s.status === "DRAFT")).toHaveLength(1);
  });
});
