export function compareLayouts(
  baselineLayout,
  currentLayout,
  tolerance = {
    x: 10,
    y: 10,
    width: 10,
    height: 10,
  }
) {
  const results = [];

  for (const baseline of baselineLayout) {
    const current = currentLayout.find(
      (item) => item.selector === baseline.selector
    );

    // ----------------------------------
    // Section Missing
    // ----------------------------------
    if (!current) {
      results.push({
        selector: baseline.selector,
        type: "MISSING_SECTION",
        severity: "HIGH",
      });

      continue;
    }

    const dx = Math.abs(baseline.x - current.x);
    const dy = Math.abs(baseline.y - current.y);
    const dw = Math.abs(baseline.width - current.width);
    const dh = Math.abs(baseline.height - current.height);

    const issues = [];

    if (dx > tolerance.x)
      issues.push({
        property: "x",
        baseline: baseline.x,
        current: current.x,
        difference: dx,
      });

    if (dy > tolerance.y)
      issues.push({
        property: "y",
        baseline: baseline.y,
        current: current.y,
        difference: dy,
      });

    if (dw > tolerance.width)
      issues.push({
        property: "width",
        baseline: baseline.width,
        current: current.width,
        difference: dw,
      });

    if (dh > tolerance.height)
      issues.push({
        property: "height",
        baseline: baseline.height,
        current: current.height,
        difference: dh,
      });

    if (issues.length > 0) {
      results.push({
        selector: baseline.selector,
        type: "LAYOUT_SHIFT",
        severity: issues.length >= 2 ? "HIGH" : "MEDIUM",
        issues,
      });
    }
  }

  return {
    totalDifferences: results.length,
    differences: results,
  };
}