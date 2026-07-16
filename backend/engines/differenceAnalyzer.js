/**
 * Difference Analyzer
 * ----------------------------------
 * Converts raw comparison metrics into
 * a human-readable QA report.
 */

export function analyzeDifferences({
  score,
  stats,
  ignoredRegions = [],
  maskedRegions = []
}) {

  const issues = [];
  const analysis = {};

  // -----------------------------
  // Overall Status
  // -----------------------------
  let overallStatus = "FAIL";

  if (score >= 98) {
    overallStatus = "EXCELLENT";
  } else if (score >= 95) {
    overallStatus = "PASS";
  } else if (score >= 85) {
    overallStatus = "NEEDS REVIEW";
  }

  // -----------------------------
  // Layout
  // -----------------------------
  if (score >= 95) {
    analysis.layout = "PASS";
  } else {
    analysis.layout = "REVIEW";

    issues.push({
      category: "Layout",
      severity: "Medium",
      message: "Layout differences detected."
    });
  }

  // -----------------------------
  // Pixel Difference Severity
  // -----------------------------
  const diffPercent =
    (stats.diffPixels / stats.totalPixels) * 100;

  if (diffPercent < 1) {

    analysis.visual = "PASS";

  } else if (diffPercent < 3) {

    analysis.visual = "MINOR";

    issues.push({
      category: "Visual",
      severity: "Low",
      message: "Minor visual differences detected."
    });

  } else if (diffPercent < 8) {

    analysis.visual = "MODERATE";

    issues.push({
      category: "Visual",
      severity: "Medium",
      message: "Noticeable UI differences found."
    });

  } else {

    analysis.visual = "MAJOR";

    issues.push({
      category: "Visual",
      severity: "High",
      message: "Large visual mismatch."
    });

  }

  // -----------------------------
  // Dynamic Components
  // -----------------------------
  analysis.dynamic = {
    ignored: ignoredRegions.length,
    masked: maskedRegions.length
  };

  if (ignoredRegions.length > 0) {

    issues.push({
      category: "Dynamic Components",
      severity: "Ignored",
      message: `${ignoredRegions.length} dynamic component(s) ignored.`
    });

  }

  // -----------------------------
  // Summary
  // -----------------------------
  const summary = [];

  summary.push(`Overall similarity is ${score.toFixed(2)}%.`);

  if (overallStatus === "EXCELLENT") {

    summary.push(
      "The page closely matches the reference design."
    );

  } else if (overallStatus === "PASS") {

    summary.push(
      "The page is visually acceptable."
    );

  } else {

    summary.push(
      "Visual review is recommended."
    );

  }

  if (ignoredRegions.length > 0) {

    summary.push(
      `${ignoredRegions.length} dynamic region(s) were ignored during comparison.`
    );

  }

  if (maskedRegions.length > 0) {

    summary.push(
      `${maskedRegions.length} region(s) were masked before comparison.`
    );

  }

  return {

    summary: {
      score,
      status: overallStatus,
      text: summary.join(" ")
    },

    analysis,

    issues

  };

}