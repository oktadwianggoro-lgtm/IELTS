import { describe, expect, it } from "vitest";
import { allNavItems, mobilePrimaryHrefs, navGroups } from "@/lib/nav-config";
import { dictionary, locales } from "@/lib/i18n/dictionary";

describe("nav config", () => {
  it("has a translation for every nav item in every locale", () => {
    for (const item of allNavItems) {
      for (const locale of locales) {
        expect(dictionary[locale].nav[item.key]).toBeTruthy();
      }
    }
  });

  it("has unique hrefs across all groups", () => {
    const hrefs = allNavItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("only references mobile primary hrefs that exist in the nav groups", () => {
    const hrefs = new Set(allNavItems.map((item) => item.href));
    for (const href of mobilePrimaryHrefs) {
      expect(hrefs.has(href)).toBe(true);
    }
  });

  it("keeps the dashboard as the first mobile primary item", () => {
    expect(mobilePrimaryHrefs[0]).toBe("/dashboard");
  });

  it("has at least one group", () => {
    expect(navGroups.length).toBeGreaterThan(0);
  });
});
