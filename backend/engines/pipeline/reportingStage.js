import path from "path";

import { analyzeDifferences } from "../differenceAnalyzer.js";
import { generateReport } from "../reportGenerator.js";

export function reportingStage({
  url,
  baselinePath,
  comparison,
  livePath,
  issueReport,
  domAnalysis,
  strategy,
  ignoreSelectors,
  maskedRegions,
  executionTime
}) {

  console.log("\n========== Reporting Stage ==========\n");

  // ==========================================
  // Difference Analysis
  // ==========================================

  const analysis = analyzeDifferences({

    score: comparison.score,

    stats: comparison.stats,

    ignoredRegions: ignoreSelectors,

    maskedRegions

  });

  // ==========================================
  // Final Report
  // ==========================================

  const report = generateReport({

    url,

    baselinePath: path.resolve(
      process.cwd(),
      baselinePath
    ),

    livePath,

    diffPath: path.resolve(
      process.cwd(),
      comparison.diffPath
    ),

    comparison,

    analysis,

    issueReport,

    ignoredRegions: ignoreSelectors,

    maskedRegions,

    domAnalysis,

    strategy,

    executionTime

  });

  console.log("\n========================================");
  console.log("Visual Test Completed");
  console.log("Score :", report.summary.score);
  console.log("Status:", report.summary.status);
  console.log("========================================\n");

  return report;

}