import path from "path";

import { captureScreenshot } from "../screenshot.js";
import { compareImages } from "../comparator.js";

import { detectClusters } from "../../smartDifference/clusterDetector.js";
import { mergeBoundingBoxes } from "../../smartDifference/boundingBoxMerger.js";
import { generateCrops } from "../../smartDifference/cropGenerator.js";
import { identifySections } from "../../smartDifference/sectionIdentifier.js";
import { generateIssues } from "../../smartDifference/issueGenerator.js";

export async function comparisonStage({ page, baselinePath }) {
  console.log("\n========== Comparison Stage ==========\n");

  // ============================================
  // 1. Capture Screenshot
  // ============================================
await page.screenshot({
    path: "beforeComparison.png",
    fullPage: true
});
  const { path: livePath, timestamp } = await captureScreenshot(page);

  // ============================================
  // 2. Compare Images
  // ============================================

  const comparison = await compareImages(baselinePath, livePath);

  // ============================================
  // 3. Detect Changed Clusters
  // ============================================

  const clusterResult = await detectClusters(comparison.diffPath);

  // ============================================
  // 4. Merge Nearby Boxes
  // ============================================

  const mergedBoxes = mergeBoundingBoxes(clusterResult.clusters);

  // ============================================
  // 5. Generate Crops
  // ============================================

  const crops = await generateCrops({
    baselinePath: path.resolve(process.cwd(), baselinePath),

    livePath,

    diffPath: path.resolve(process.cwd(), comparison.diffPath),

    boxes: mergedBoxes,
  });

  // ============================================
  // 6. Identify DOM Sections
  // ============================================

  const boxesWithSections = await identifySections(page, mergedBoxes);

  // ============================================
  // 7. Combine Region Data
  // ============================================

  const smartRegions = boxesWithSections.map((box, index) => ({
    ...box,
    ...(crops[index] || {}),
  }));

  // ============================================
  // 8. Generate Smart Issues
  // ============================================

  const issueReport = generateIssues({
    regions: smartRegions,
    comparison,
  });

  console.log("\n========== Comparison Completed ==========\n");

  return {
    livePath,

    timestamp,

    comparison,

    smartRegions,

    issueReport,
  };
}
