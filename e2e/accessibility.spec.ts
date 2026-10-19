import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { registerAndLandOnDashboard } from "./helpers";

/**
 * Automated WCAG scan via axe-core — catches a real, well-defined subset of
 * accessibility issues (contrast, missing labels/alt text, invalid ARIA,
 * landmark structure), not a full manual audit. Scoped to "critical" and
 * "serious" impact violations on a handful of representative pages (public
 * shell + one authenticated page), not every page in the app — see D-042
 * for why a full page-by-page WCAG AA audit is out of scope for this phase.
 */
test.describe("Accessibility (axe-core)", () => {
  async function scan(page: import("@playwright/test").Page) {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    return serious;
  }

  test("landing page (/) has no critical/serious violations", async ({ page }) => {
    await page.goto("/");
    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("Info IELTS page has no critical/serious violations", async ({ page }) => {
    await page.goto("/info-ielts");
    expect(await scan(page)).toEqual([]);
  });

  test("Privacy page has no critical/serious violations", async ({ page }) => {
    await page.goto("/privasi");
    expect(await scan(page)).toEqual([]);
  });

  test("login page has no critical/serious violations", async ({ page }) => {
    await page.goto("/login");
    expect(await scan(page)).toEqual([]);
  });

  test("dashboard (authenticated) has no critical/serious violations", async ({ page }) => {
    await registerAndLandOnDashboard(page, "a11y-dashboard");
    expect(await scan(page)).toEqual([]);
  });
});
