import { preparationStage } from "./pipeline/preparationStage.js";
import { analysisStage } from "./pipeline/analysisStage.js";
import { comparisonStage } from "./pipeline/comparisonStage.js";
import { reportingStage } from "./pipeline/reportingStage.js";

export async function runVisualTest(
  url,
  baselinePath,
  ignoreSelectors = []
) {

  if (!url) {
    throw new Error("URL is required.");
  }

  if (!baselinePath) {
    throw new Error("Baseline image is required.");
  }

  let browser;

  const startTime = Date.now();

  try {

    // ============================================
    // Preparation Stage
    // ============================================

    const preparation = await preparationStage({
      url,
      baselinePath,
      ignoreSelectors
    });

    browser = preparation.browser;

    const { page } = preparation;

    // ============================================
    // Analysis Stage
    // ============================================

    const {
      domAnalysis,
      components,
      strategy,
      maskedRegions
    } = await analysisStage({
      page,
      ignoreSelectors
    });

    // ============================================
    // Comparison Stage
    // ============================================

    const {
      livePath,
      comparison,
      smartRegions,
      issueReport
    } = await comparisonStage({
      page,
      baselinePath
    });

    // ============================================
    // Reporting Stage
    // ============================================

    const report = reportingStage({

      url,

      baselinePath,

      comparison,

      livePath,

      issueReport,

      domAnalysis,

      strategy,

      ignoreSelectors,

      maskedRegions,

      executionTime:
        Date.now() - startTime

    });

    return report;

  } catch (err) {

    console.error("\nVisual Engine Error");
    console.error(err);

    throw new Error(
      `Visual Comparison Failed: ${err.message}`
    );

  } finally {

    if (browser) {
      await browser.close();
    }

  }

}