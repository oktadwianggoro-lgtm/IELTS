import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// A phrase that only exists in SPEAKING-PART1-001's model answer — used to
// assert it never reaches the client before it should (D-021-style).
const MODEL_ANSWER_PHRASE = "I live in a mid-sized city on the coast";

test.beforeAll(async () => {
  for (const code of ["SPEAKING-PART1-001", "SPEAKING-PART2-001", "SPEAKING-PART3-001"]) {
    await prisma.speakingPrompt.update({ where: { code }, data: { reviewStatus: "PUBLISHED" } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Speaking Lab", () => {
  test("the catalog lists published prompts under their part", async ({ page }) => {
    await registerAndLandOnDashboard(page, "speaking-catalog");
    await page.goto("/speaking-lab");

    const main = page.locator("main");
    await expect(main.getByText("Hometown and Daily Routine")).toBeVisible();
    await expect(main.getByText("Describe a Skill You Would Like to Learn")).toBeVisible();
    await expect(main.getByText("Learning New Skills in Modern Society")).toBeVisible();
  });

  test("records a real answer with a fake mic, never leaks the model answer before completion, and reveals it after", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "speaking-record");

    await page.goto("/speaking-lab/SPEAKING-PART1-001");
    await expect(
      page.getByText("Hometown and Daily Routine", { exact: false }).first(),
    ).toBeVisible();

    const htmlBeforeStart = await page.content();
    expect(htmlBeforeStart).not.toContain(MODEL_ANSWER_PHRASE);

    await page.getByRole("button", { name: "Mulai Latihan" }).click();
    await page.getByRole("button", { name: "Izinkan Mikrofon & Rekam" }).click();

    await expect(page.getByText("Merekam...")).toBeVisible({ timeout: 10_000 });

    const htmlWhileRecording = await page.content();
    expect(htmlWhileRecording).not.toContain(MODEL_ANSWER_PHRASE);

    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Selesai Rekam" }).click();

    await expect(page.getByText("Tinjau Rekaman")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("audio")).toBeVisible();

    await page.getByRole("button", { name: "Kirim Rekaman" }).click();
    await expect(page.getByText("Rekaman Anda")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Selesai & Lihat Contoh Jawaban" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    const htmlAfterComplete = await page.content();
    expect(htmlAfterComplete).toContain(MODEL_ANSWER_PHRASE);

    const audioSrc = await page.locator("audio").first().getAttribute("src");
    expect(audioSrc).toMatch(/^\/api\/speaking-recordings\//);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const submission = await prisma.speakingSubmission.findFirstOrThrow({
      where: { userId: user.id },
      include: { recording: true },
    });
    expect(submission.status).toBe("COMPLETED");
    expect(submission.recording).not.toBeNull();
    expect(submission.recording!.sizeBytes).toBeGreaterThan(0);
  });

  test("the text-fallback path (skip recording) reaches completion without ever requesting the mic", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "speaking-fallback");

    await page.goto("/speaking-lab/SPEAKING-PART2-001");
    await page.getByRole("button", { name: "Mulai Latihan" }).click();
    await page.getByRole("button", { name: "Lewati, tulis jawaban saja" }).click();

    await expect(page.getByText("Jawaban Tertulis", { exact: true })).toBeVisible();
    const textarea = page.getByPlaceholder("Tulis apa yang ingin Anda katakan di sini...");
    await textarea.fill("A fallback written answer about a skill I would like to learn.");

    await page.getByRole("button", { name: "Selesai & Lihat Contoh Jawaban" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("audio")).toHaveCount(0);
    await expect(page.getByText("A fallback written answer", { exact: false })).toBeVisible();
  });

  test("self-assessment checkbox state persists after a reload", async ({ page }) => {
    await registerAndLandOnDashboard(page, "speaking-self-assessment");

    await page.goto("/speaking-lab/SPEAKING-PART3-001");
    await page.getByRole("button", { name: "Mulai Latihan" }).click();
    await page.getByRole("button", { name: "Lewati, tulis jawaban saja" }).click();
    await page
      .getByPlaceholder("Tulis apa yang ingin Anda katakan di sini...")
      .fill("A written discussion answer for part 3.");
    await page.getByRole("button", { name: "Selesai & Lihat Contoh Jawaban" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-checked", "");

    await page.reload();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox").first()).toHaveAttribute("data-checked", "");
  });

  test("'Coba Lagi' starts a brand new attempt, and deleting a recording clears it from the completed view", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "speaking-retry");

    await page.goto("/speaking-lab/SPEAKING-PART1-001");
    await page.getByRole("button", { name: "Mulai Latihan" }).click();
    await page.getByRole("button", { name: "Izinkan Mikrofon & Rekam" }).click();
    await expect(page.getByText("Merekam...")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Selesai Rekam" }).click();
    await expect(page.getByText("Tinjau Rekaman")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Kirim Rekaman" }).click();
    await expect(page.getByText("Rekaman Anda")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Selesai & Lihat Contoh Jawaban" }).click();
    await expect(page.getByText("Self-Assessment", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Hapus Rekaman" }).click();
    await expect(page.locator("audio")).toHaveCount(0, { timeout: 10_000 });

    await page.getByRole("button", { name: "Coba Lagi" }).click();
    await expect(page.getByRole("button", { name: "Izinkan Mikrofon & Rekam" })).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const submissions = await prisma.speakingSubmission.findMany({
      where: { userId: user.id },
      include: { recording: true },
    });
    expect(submissions).toHaveLength(2);
    expect(submissions.filter((s) => s.status === "COMPLETED")).toHaveLength(1);
    expect(submissions.filter((s) => s.status === "IN_PROGRESS")).toHaveLength(1);
    // The deleted recording's row is gone entirely, not just unlinked.
    const recordingCount = await prisma.speakingRecording.count({ where: { userId: user.id } });
    expect(recordingCount).toBe(0);
  });
});
