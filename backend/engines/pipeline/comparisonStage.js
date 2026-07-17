import path from "path";

import { captureScreenshot } from "../screenshot.js";
import { compareImages } from "../comparator.js";

import { detectClusters } from "../../smartDifference/clusterDetector.js";
import { mergeBoundingBoxes } from "../../smartDifference/boundingBoxMerger.js";
import { generateCrops } from "../../smartDifference/cropGenerator.js";
import { identifySections } from "../../smartDifference/sectionIdentifier.js";
import { generateIssues } from "../../smartDifference/issueGenerator.js";

export async function comparisonStage({
  page,
  baselinePath,
  analysis,
}) {
  console.log("\n========== Comparison Stage ==========\n");

  const { maskedRegions = [] } = analysis || {};

  console.log(
    `Ignored Regions: ${maskedRegions.length}`
  );

  // Debug screenshot
  await page.screenshot({
    path: "masked-page.png",
    fullPage: true,
  });

  // ============================================
  // 1. Capture Screenshot
  // ============================================

  const { path: livePath, timestamp } =
    await captureScreenshot(page);

  // ============================================
  // 2. Compare Images
  // ============================================

  const comparison = await compareImages({
    baselinePath,
    livePath,
    ignoredRegions: maskedRegions,
  });

  // ============================================
  // 3. Detect Changed Clusters
  // ============================================

  const clusterResult =
    await detectClusters(comparison.diffPath);

  // ============================================
  // 4. Merge Nearby Boxes
  // ============================================

  const mergedBoxes = mergeBoundingBoxes(
    clusterResult.clusters
  );

  // ============================================
  // 5. Generate Crops
  // ============================================

  const crops = await generateCrops({
    baselinePath: path.resolve(
      process.cwd(),
      baselinePath
    ),
    livePath,
    diffPath: path.resolve(
      process.cwd(),
      comparison.diffPath
    ),
    boxes: mergedBoxes,
  });

  // ============================================
  // 6. Identify DOM Sections
  // ============================================

  const boxesWithSections =
    await identifySections(page, mergedBoxes);

  // ============================================
  // 7. Combine Region Data
  // ============================================

  const smartRegions = boxesWithSections.map(
    (box, index) => ({
      ...box,
      ...(crops[index] || {}),
    })
  );

  // ============================================
  // 8. Generate Smart Issues
  // ============================================

  const issueReport = generateIssues({
    regions: smartRegions,
    comparison,
  });

  console.log(
    "\n========== Comparison Completed ==========\n"
  );

  return {
    livePath,
    timestamp,
    comparison,
    smartRegions,
    issueReport,
  };
}