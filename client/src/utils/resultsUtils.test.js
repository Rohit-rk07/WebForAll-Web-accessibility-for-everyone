import { describe, it, expect } from "vitest";
import {
  extractAxeResults,
  getNormalizedSeverity,
  calculateAccessibilityScore,
  calculateResultCounts,
  getSeverityConfig,
} from "./resultsUtils";

describe("extractAxeResults", () => {
  it("extracts results nested under resultData.results", () => {
    const data = { results: { violations: [{ id: "a" }] }, score: 50 };
    expect(extractAxeResults(data, "violations")).toEqual([{ id: "a" }]);
  });

  it("extracts top-level results arrays", () => {
    const data = { violations: [{ id: "b" }] };
    expect(extractAxeResults(data, "violations")).toEqual([{ id: "b" }]);
  });

  it("returns an empty array for missing or non-array data", () => {
    expect(extractAxeResults(null, "violations")).toEqual([]);
    expect(extractAxeResults({}, "violations")).toEqual([]);
    expect(extractAxeResults({ violations: "nope" }, "violations")).toEqual([]);
  });
});

describe("getNormalizedSeverity", () => {
  it("maps axe impact values to display levels", () => {
    expect(getNormalizedSeverity({ impact: "critical" })).toBe("critical");
    expect(getNormalizedSeverity({ impact: "serious" })).toBe("serious");
    expect(getNormalizedSeverity({ impact: "moderate" })).toBe("moderate");
    expect(getNormalizedSeverity({ impact: "minor" })).toBe("minor");
  });

  it("maps legacy severity names and falls back to minor", () => {
    expect(getNormalizedSeverity({ severity: "error" })).toBe("critical");
    expect(getNormalizedSeverity({ severity: "warning" })).toBe("serious");
    expect(getNormalizedSeverity({ severity: "notice" })).toBe("moderate");
    expect(getNormalizedSeverity({ severity: "layout" })).toBe("minor");
    expect(getNormalizedSeverity({})).toBe("minor");
  });
});

describe("calculateAccessibilityScore", () => {
  it("returns 100 when there are no issues", () => {
    const result = calculateAccessibilityScore({ results: { violations: [] } });
    expect(result.score).toBe(100);
    expect(result.totalIssues).toBe(0);
  });

  it("deducts points based on severity", () => {
    const result = calculateAccessibilityScore({
      violations: [
        { impact: "critical" },
        { impact: "serious" },
        { impact: "moderate" },
        { impact: "minor" },
      ],
    });
    // 100 - (5 + 2 + 1 + 0.5) = 91.5 -> rounds to 92
    expect(result.score).toBe(92);
    expect(result.totalIssues).toBe(4);
    expect(result.severityCounts).toEqual({
      critical: 1,
      serious: 1,
      moderate: 1,
      minor: 1,
    });
  });

  it("clamps the score to a minimum of 0", () => {
    const criticalOnly = Array.from({ length: 30 }, () => ({ impact: "critical" }));
    const result = calculateAccessibilityScore({ violations: criticalOnly });
    expect(result.score).toBe(0);
  });
});

describe("calculateResultCounts", () => {
  it("counts each category", () => {
    const counts = calculateResultCounts({
      results: {
        violations: [{}, {}],
        passes: [{}],
        incomplete: [{}],
        inapplicable: [{}],
      },
    });
    expect(counts).toEqual({
      violations: 2,
      passes: 1,
      incomplete: 1,
      inapplicable: 1,
    });
  });
});

describe("getSeverityConfig", () => {
  const theme = {
    palette: {
      background: { paper: "#fff", default: "#fafafa" },
      divider: "#ddd",
      text: { primary: "#000", secondary: "#666" },
      primary: { main: "#4361ee" },
      secondary: { main: "#7209b7" },
      success: { main: "#28a745" },
      error: { main: "#dc3545" },
      warning: { main: "#ffc107" },
      info: { main: "#17a2b8" },
    },
  };
  const icons = {
    ErrorOutline: () => null,
    WarningAmber: () => null,
    InfoOutlined: () => null,
    CheckCircleOutline: () => null,
  };

  it("provides severity config with MUI color names", () => {
    const { severityMap, colors } = getSeverityConfig(theme, icons);
    expect(severityMap.critical.color).toBe("error");
    expect(severityMap.serious.color).toBe("warning");
    expect(severityMap.moderate.color).toBe("info");
    expect(severityMap.minor.color).toBe("info");
    expect(colors.primary).toBe("#4361ee");
  });
});