import "dotenv/config";
import { test, expect } from "@playwright/test";
import { registerAndLandOnDashboard } from "./helpers";

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("content CMS", () => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_EMAIL/PASSWORD not set");

  test("a student is blocked from the admin content CMS", async ({ page }) => {
    await registerAndLandOnDashboard(page, "cms-student");
    await page.goto("/admin/content");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin can see the imported lesson and walk it through the full editorial workflow", async ({
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

    // Walk the full DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED workflow.
    const clickAndExpectStatus = async (buttonName: string, statusText: string) => {
      await page.getByRole("button", { name: buttonName }).click();
      await expect(page.getByText(statusText, { exact: true }).first()).toBeVisible();
    };

    // Lesson may already be PUBLISHED from a previous run of this test; if
    // so, send it back to Draft first so the workflow is exercised fresh.
    if (
      await page
        .getByRole("button", { name: "Arsipkan" })
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole("button", { name: "Arsipkan" }).click();
      await expect(page.getByText("Diarsipkan", { exact: true }).first()).toBeVisible();
      await clickAndExpectStatus("Kembalikan ke Draft", "Draft");
    }

    await clickAndExpectStatus("Kirim untuk Review", "Dalam Review");
    await clickAndExpectStatus("Setujui", "Disetujui");
    await clickAndExpectStatus("Terbitkan", "Diterbitkan");

    await expect(page.getByText(/Ditinjau oleh/i)).toBeVisible();
  });
});
