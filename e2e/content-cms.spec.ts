import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { registerAndLandOnDashboard } from "./helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("content CMS", () => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_EMAIL/PASSWORD not set");

  test("a student is blocked from the admin content CMS", async ({ page }) => {
    await registerAndLandOnDashboard(page, "cms-student");
    await page.goto("/admin/content");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin can see the imported lesson in the CMS list with a real preview", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/content");
    await expect(page.getByText("STARTER-GRAM-001")).toBeVisible();

    await page.getByText("Alphabet dan Spelling").click();
    await expect(page).toHaveURL(/\/admin\/content\/STARTER-GRAM-001$/);

    // Preview renders real lesson content, not a placeholder.
    await expect(page.getByRole("heading", { name: /Alphabet dan Spelling/i })).toBeVisible();
    await expect(page.getByText(/mengeja/i).first()).toBeVisible();
    await expect(page.getByText(/5 soal/i)).toBeVisible();
  });

  test("admin can walk a lesson through the full editorial workflow", async ({ page }) => {
    // Uses its own throwaway lesson (not the shared seed lesson other specs
    // browse/publish concurrently) so status-cycling here can't race with
    // e.g. materi-catalog.spec.ts, which depends on STARTER-GRAM-001 staying
    // PUBLISHED throughout the whole run.
    const code = `E2E-CMS-WORKFLOW-${Date.now()}`;
    const mod = await prisma.module.findUniqueOrThrow({ where: { code: "STARTER-FOUNDATIONS" } });
    await prisma.lesson.create({
      data: {
        code,
        moduleId: mod.id,
        title: `Lesson uji alur editorial ${code}`,
        level: "STARTER",
        skill: "GRAMMAR",
        estimatedMinutes: 5,
        order: 999,
        objectives: ["Objective uji coba"],
        content: {
          explanationId: "Penjelasan uji coba yang cukup panjang untuk lolos validasi tampilan.",
          coreConcept:
            "Test core concept long enough to render without issues in the preview page.",
          examples: [
            { correct: "Contoh benar 1", reason: "Alasan 1" },
            { correct: "Contoh benar 2", reason: "Alasan 2" },
          ],
          commonMistakes: [{ mistake: "Salah 1", correction: "Benar 1" }],
          strategy: "Strategi uji coba yang cukup panjang.",
          guidedPractice: [{ prompt: "Guided 1" }, { prompt: "Guided 2" }],
          independentPractice: [{ prompt: "Independent 1" }, { prompt: "Independent 2" }],
          summary: "Ringkasan uji coba yang cukup panjang untuk lolos validasi.",
          checklist: ["Checklist 1", "Checklist 2"],
        },
      },
    });

    try {
      await loginAsAdmin(page);
      await page.goto(`/admin/content/${code}`);
      await expect(page.getByText(code).first()).toBeVisible();

      const clickAndExpectStatus = async (buttonName: string, statusText: string) => {
        await page.getByRole("button", { name: buttonName }).click();
        await expect(page.getByText(statusText, { exact: true }).first()).toBeVisible();
      };

      await clickAndExpectStatus("Kirim untuk Review", "Dalam Review");
      await clickAndExpectStatus("Setujui", "Disetujui");
      await clickAndExpectStatus("Terbitkan", "Diterbitkan");

      await expect(page.getByText(/Ditinjau oleh/i)).toBeVisible();
    } finally {
      await prisma.lesson.delete({ where: { code } }).catch(() => undefined);
    }
  });
});
