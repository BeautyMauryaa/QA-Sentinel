/**
 * issueGenerator.js
 * --------------------------------------------
 * Converts detected visual differences into
 * human-readable QA issues.
 */

export function generateIssues({ regions = [], comparison }) {
  const issues = [];

  //----------------------------------------
  // Severity Calculator
  //----------------------------------------

  function getSeverity(area) {
    if (area > 180000) return "Critical";

    if (area > 80000) return "High";

    if (area > 25000) return "Medium";

    return "Low";
  }

  //----------------------------------------
  // Confidence Calculator
  //----------------------------------------

  function getConfidence(pixels) {
    if (pixels > 50000) return 99;

    if (pixels > 20000) return 96;

    if (pixels > 10000) return 92;

    return 85;
  }

  //----------------------------------------
  // Category
  //----------------------------------------

  function getCategory(region) {
    if (region.width > 500 || region.height > 300) {
      return "Layout";
    }

    if (region.pixels > 15000) {
      return "Visual";
    }

    return "Component";
  }

  //----------------------------------------
  // Recommendation
  //----------------------------------------

  function recommendation(category) {
    switch (category) {
      case "Layout":
        return "Verify spacing, alignment, width and positioning.";

      case "Visual":
        return "Compare colors, typography and assets.";

      case "Component":
        return "Inspect the component styling and rendering.";

      default:
        return "Review manually.";
    }
  }

  //----------------------------------------
  // Build Issues
  //----------------------------------------

  regions.forEach((region, index) => {
    const severity = getSeverity(region.area);

    const category = getCategory(region);

    const confidence = getConfidence(region.pixels);

    issues.push({
      id: index + 1,

      title: `${category} difference detected`,

      category,

      severity,

      confidence: `${confidence}%`,

      section: region.section?.name || "Unknown Section",

      selector: region.section?.selector || "",

      description: `${category} changes detected in "${region.section?.name || "Unknown Section"}".`,

      recommendation: recommendation(category),

      location: {
        x: region.x,

        y: region.y,

        width: region.width,

        height: region.height,
      },

      statistics: {
        pixels: region.pixels,

        area: region.area,
      },

      evidence: {
        baseline: region.baseline,

        live: region.live,

        diff: region.diff,
      },
    });
  });

  //----------------------------------------
  // Summary
  //----------------------------------------

  return {
    totalIssues: issues.length,

    critical: issues.filter((i) => i.severity === "Critical").length,

    high: issues.filter((i) => i.severity === "High").length,

    medium: issues.filter((i) => i.severity === "Medium").length,

    low: issues.filter((i) => i.severity === "Low").length,

    score: comparison.score,

    status: comparison.status,

    issues,
  };
}
