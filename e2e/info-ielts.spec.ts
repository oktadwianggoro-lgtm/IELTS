import { test, expect } from "@playwright/test";

test.describe("Info IELTS (public page)", () => {
  test("is reachable without logging in, shows the disclaimer, FAQ, and verified official links", async ({
    page,
  }) => {
    await page.goto("/info-ielts");
    // No redirect to /login — this page is genuinely public, unlike the
    // rest of the app.
    await expect(page).toHaveURL(/\/info-ielts$/);

    // The disclaimer is intentionally rendered twice (top and bottom of the
    // page), so scope to the first match rather than requiring uniqueness.
    await expect(page.getByText(/bukan penyelenggara atau mitra resmi IELTS/i).first()).toBeVisible();
    await expect(page.getByText("Apa beda IELTS Academic dan General Training?")).toBeVisible();
    await expect(page.getByText(/Diverifikasi \d{1,2}\/\d{1,2}\/\d{4}/).first()).toBeVisible();

    const links = await page.locator('a[href^="https://ielts.org"], a[href^="https://takeielts"]').count();
    expect(links).toBeGreaterThan(0);
  });

  test("the band calculator applies the official rounding rule to four user-supplied bands", async ({
    page,
  }) => {
    await page.goto("/info-ielts");

    const comboboxes = page.getByRole("combobox");
    // Listening, Reading, Writing, Speaking — in that order (6, 6, 6.5, 7
    // averages to 6.375, which the official rule rounds up to 6.5).
    await comboboxes.nth(0).click();
    await page.getByRole("option", { name: "6.0", exact: true }).click();
    await comboboxes.nth(1).click();
    await page.getByRole("option", { name: "6.0", exact: true }).click();
    await comboboxes.nth(2).click();
    await page.getByRole("option", { name: "6.5", exact: true }).click();
    await comboboxes.nth(3).click();
    await page.getByRole("option", { name: "7.0", exact: true }).click();

    await page.getByRole("button", { name: "Hitung Overall Band" }).click();
    await expect(page.getByTestId("band-calculator-result")).toHaveText("6.5");
  });

  test("sitemap.xml and robots.txt are served and reference the public page", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("/info-ielts");

    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Sitemap:");
    expect(robotsBody).toContain("Disallow: /dashboard");
  });
});
