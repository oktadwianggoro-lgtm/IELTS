import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComingSoon } from "@/components/coming-soon";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

describe("ComingSoon", () => {
  it("renders the feature title and planned phase without claiming the feature is live", () => {
    render(
      <LocaleProvider initialLocale="id">
        <ComingSoon title="Listening Lab" plannedPhase="Fase 7" />
      </LocaleProvider>,
    );

    expect(screen.getByText("Listening Lab")).toBeInTheDocument();
    expect(screen.getByText("Fase 7")).toBeInTheDocument();
    expect(screen.getByText(/segera tersedia/i)).toBeInTheDocument();
  });
});
