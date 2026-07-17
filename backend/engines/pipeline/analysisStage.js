import { analyzeDOM } from "../analysis/domAnalyzer.js";
import { detectComponents } from "../analysis/componentDetector.js";
import { buildComparisonStrategy } from "../dynamic/strategyEngine.js";
import { freezeDynamicElements } from "../dynamic/freezeDynamic.js";
import { maskRegions } from "../dynamic/regionMasker.js";

export async function analysisStage({
  page,
  ignoreSelectors = []
}) {

  console.log("\n========== Analysis Stage ==========\n");

  // ============================================
  // 1. Analyze DOM
  // ============================================

  const domAnalysis = await analyzeDOM(page);

  // ============================================
  // 2. Detect Components
  // ============================================

  const components = await detectComponents(page);

  // ============================================
  // 3. Build Comparison Strategy
  // ============================================

  const strategy = buildComparisonStrategy(domAnalysis);

  // ============================================
  // 4. Freeze Dynamic Elements
  // ============================================

  if (strategy.freeze.length > 0) {

    console.log(
      `Freezing ${strategy.freeze.length} dynamic sections...`
    );

    await freezeDynamicElements(page, strategy.freeze);

  }

  // ============================================
  // 5. Mask Dynamic Regions
  // ============================================

  const maskedRegions = await maskRegions(
    page,
    ignoreSelectors,
    strategy.mask
  );

  console.log("\n========== Analysis Completed ==========\n");

  return {
    domAnalysis,
    components,
    strategy,
    maskedRegions
  };

}