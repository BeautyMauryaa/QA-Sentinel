/**
 * Report Generator
 * -----------------------------------
 * Combines all QA results into one
 * structured response.
 */

import path from "path";

export function generateReport({
  url,
  baselinePath,
  livePath,
  diffPath,
  comparison,
  analysis,
  issueReport,
  ignoredRegions = [],
  maskedRegions = [],
  detectedComponents = [],
  executionTime = 0,
})  {
  return {
    // ==========================
    // Metadata
    // ==========================
    metadata: {
      generatedAt: new Date().toISOString(),

      executionTime: `${executionTime} ms`,

      url,

      engine: "QA Sentinel v1.0",
    },

    // ==========================
    // Overall Result
    // ==========================
    summary: {
      score: comparison.score,

      status: comparison.status,

      verdict: analysis.summary.status,

      message: analysis.summary.text,
    },

    // ==========================
    // Pixel Statistics
    // ==========================
    statistics: {
      totalPixels: comparison.stats.totalPixels,

      matchedPixels: comparison.stats.matchedPixels,

      differentPixels: comparison.stats.diffPixels,

      similarity: `${comparison.score.toFixed(2)}%`,
    },

    // ==========================
    // Smart Analysis
    // ==========================
    analysis: analysis.analysis,

    // ==========================
    // Issues
    // ==========================
   //issues: issueReport.issues,
    issues: issueReport?.issues ?? [],

issueSummary: {
  total: issueReport?.totalIssues ?? 0,
  critical: issueReport?.critical ?? 0,
  high: issueReport?.high ?? 0,
  medium: issueReport?.medium ?? 0,
  low: issueReport?.low ?? 0,
},
    // ==========================
    // Dynamic Components
    // ==========================
    dynamicComponents: {
      detected: detectedComponents,

      ignored: ignoredRegions,

      masked: maskedRegions,
    },

    // ==========================
    // Artifacts
    // ==========================
    artifacts: {
      baseline: path.relative(process.cwd(), baselinePath),

      live: path.relative(process.cwd(), livePath),

      diff: path.relative(process.cwd(), diffPath),
    },
   
  };
}
