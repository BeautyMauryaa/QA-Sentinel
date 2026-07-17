export function generateAIIssues({
  comparison,
  layoutIssues = [],
  textIssues = [],
  components = [],
}) {
  console.log("\n========== AI Issue Engine ==========\n");

  const componentMap = new Map();

  // ---------------------------------------
  // Initialize Components
  // ---------------------------------------

  for (const component of components) {
    componentMap.set(component.selector, {
      component: component.component,
      selector: component.selector,
      severity: "LOW",
      issues: [],
    });
  }

  // ---------------------------------------
  // Layout Issues
  // ---------------------------------------

  for (const issue of layoutIssues) {
    const item =
      componentMap.get(issue.selector) || {
        component: issue.selector,
        selector: issue.selector,
        severity: "LOW",
        issues: [],
      };

    item.issues.push({
      type: "LAYOUT",
      title: "Layout Shift",
      details: issue.issues,
    });

    item.severity = issue.severity;

    componentMap.set(issue.selector, item);
  }

  // ---------------------------------------
  // Text Issues
  // ---------------------------------------

  for (const issue of textIssues) {
    const item =
      componentMap.get(issue.selector) || {
        component: issue.selector,
        selector: issue.selector,
        severity: "LOW",
        issues: [],
      };

    item.issues.push({
      type: "TEXT",
      title: "Text Changed",
      expected: issue.expected,
      actual: issue.actual,
    });

    componentMap.set(issue.selector, item);
  }

  // ---------------------------------------
  // Global Pixel Difference
  // ---------------------------------------

  if (comparison.score < 95) {
    componentMap.set("__GLOBAL__", {
      component: "Visual Comparison",
      selector: "__GLOBAL__",
      severity: "HIGH",
      issues: [
        {
          type: "PIXEL",
          title: "Visual Regression",
          changedPixels: comparison.stats.changedPixels,
          score: comparison.score,
        },
      ],
    });
  }

  const issues = [...componentMap.values()];

  console.log(
    `Generated ${issues.length} AI issues`
  );

  return issues;
}