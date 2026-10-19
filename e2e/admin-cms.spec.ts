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

test.describe("Admin CMS — Fase 13", () => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_EMAIL/PASSWORD not set");

  test("test builder: admin creates a mock test, adds a real published passage as a section, and it reaches the student tryout catalog after publishing", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const code = `MOCKTEST-E2E-${Date.now()}`;
    // Unique per run, same reason uniqueEmail() exists — a static title
    // would collide with leftover rows from earlier runs of this same
    // test in the shared dev database and make the catalog assertion
    // below match more than one element.
    const title = `E2E Test Builder Mock Test ${Date.now()}`;

    await page.goto("/admin/test-builder/new");
    await page.getByLabel("Kode Mock Test").fill(code);
    await page.getByLabel("Judul Mock Test").fill(title);
    await page.getByLabel("Kode Blueprint").fill(`BLUEPRINT-${code}`);
    await page.getByLabel("Judul Blueprint").fill("E2E Blueprint");
    await page
      .getByLabel("Deskripsi")
      .fill("Blueprint dibuat lewat test builder untuk verifikasi E2E.");
    await page.getByLabel("Durasi (menit)").fill("15");
    await page.getByRole("button", { name: "Buat Mock Test" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/test-builder/${code}$`), { timeout: 10_000 });

    const passage = await prisma.readingPassage.findFirstOrThrow({
      where: { reviewStatus: "PUBLISHED" },
    });
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: passage.title }).click();
    await page.getByRole("button", { name: "Tambah Section" }).click();
    await expect(page.getByText(`1. ${passage.title}`)).toBeVisible({ timeout: 10_000 });

    // Publish through the existing editorial workflow (DRAFT -> IN_REVIEW
    // -> APPROVED -> PUBLISHED), same as every other content type.
    await page.goto(`/admin/content/${code}`);
    await page.getByRole("button", { name: "Kirim untuk Review" }).click();
    await page.getByRole("button", { name: "Setujui" }).click();
    await page.getByRole("button", { name: "Terbitkan" }).click();
    await expect(page.getByText("Diterbitkan")).toBeVisible({ timeout: 10_000 });

    // A real audit trail entry exists for each transition, not just the DB
    // row changing.
    const mockTest = await prisma.mockTest.findUniqueOrThrow({ where: { code } });
    const logs = await prisma.auditLog.findMany({
      where: { entityType: "MockTest", entityId: mockTest.id },
    });
    expect(logs.length).toBeGreaterThanOrEqual(3);

    await page.goto("/tryout");
    await expect(page.getByText(title)).toBeVisible();
  });

  test("question reports: a student's report reaches the admin queue and can be resolved", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page, "report-student");

    const passage = await prisma.readingPassage.findFirstOrThrow({
      where: { reviewStatus: "PUBLISHED" },
      include: { questions: { take: 1 } },
    });
    await page.goto(`/reading-lab/${passage.code}`);

    // Answer everything minimally just to reach the checked/result state
    // where the report button lives.
    const main = page.locator("main");
    for (const inp of await main.locator('input:not([type="radio"])').all()) await inp.fill("x");
    for (const g of await main.locator('[role="radiogroup"]').all()) {
      await g.locator('[role="radio"]').first().click();
    }
    await page.getByRole("button", { name: "Periksa Jawaban" }).click();
    await page.getByRole("button", { name: "Laporkan soal" }).first().waitFor({ timeout: 10_000 });

    await page.getByRole("button", { name: "Laporkan soal" }).first().click();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Kunci jawaban sepertinya salah" }).click();
    await page.getByPlaceholder("Detail tambahan (opsional)").fill("Verifikasi E2E Fase 13.");
    await page.getByRole("button", { name: "Kirim Laporan" }).click();
    await expect(page.getByText("sudah terkirim")).toBeVisible({ timeout: 10_000 });

    // Context isolation: open the admin view in a fresh context so we're
    // not relying on the student session having admin rights.
    const adminContext = await page.context().browser()!.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto("/admin/question-reports");
    await expect(adminPage.getByText("Verifikasi E2E Fase 13.")).toBeVisible();

    await adminPage.getByRole("button", { name: "Tandai Selesai" }).first().click();
    await expect(adminPage.getByText("Verifikasi E2E Fase 13.")).toHaveCount(0, {
      timeout: 10_000,
    });
    await adminContext.close();
  });

  test("user management is ADMIN-only; a TEACHER account is redirected away from it", async ({
    page,
  }) => {
    const email = await registerAndLandOnDashboard(page, "teacher-access");
    await prisma.user.update({ where: { email }, data: { role: "TEACHER" } });

    // Role takes effect on next sign-in — re-authenticate.
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // A teacher CAN reach the general CMS...
    await page.goto("/admin/content");
    await expect(page).toHaveURL(/\/admin\/content$/);
    // ...but NOT user management or the audit log (ADMIN-only).
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("review queue surfaces content actually sitting IN_REVIEW, across content types", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const lesson = await prisma.lesson.findFirstOrThrow({});
    const previousStatus = lesson.reviewStatus;
    await prisma.lesson.update({ where: { id: lesson.id }, data: { reviewStatus: "IN_REVIEW" } });

    try {
      await page.goto("/admin/review-queue");
      await expect(page.getByText(lesson.title)).toBeVisible();
    } finally {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { reviewStatus: previousStatus },
      });
    }
  });
});
