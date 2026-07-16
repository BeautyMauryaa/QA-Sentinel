// import { chromium } from "playwright";
// import sharp from "sharp";
// import pixelmatch from "pixelmatch";
// import fs from "fs/promises";
// import path from "path";

// export async function runVisualTest(url, baselinePath, ignoreSelectors = []) {
//   if (!baselinePath) {
//     throw new Error("Baseline path is undefined.");
//   }

//   const fullBaselinePath = path.resolve(process.cwd(), baselinePath);
//   const timestamp = Date.now();
//   const liveDir = path.join(process.cwd(), 'data', 'screenshots');
//   const livePath = path.join(liveDir, `live-${timestamp}.png`);
//   await fs.mkdir(liveDir, { recursive: true });

//   try {
//     const baselineBuffer = await fs.readFile(fullBaselinePath);
//     const { width, height } = await sharp(baselineBuffer).metadata();

//     const browser = await chromium.launch({
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
//     });'


    
//     const context = await browser.newContext({ 
//       viewport: { width, height },
//       userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//     });
    
//     const page = await context.newPage();
    
//     // Force background to avoid black screenshots
//     await page.goto(url.trim(), { waitUntil: "load", timeout: 60000 });
//     await page.addStyleTag({ content: 'body { background-color: #0b0e14 !important; }' });

//     // Stability: disable animations and scroll to top
//     await page.evaluate(() => {
//       window.history.scrollRestoration = 'manual';
//       window.scrollTo(0, 0);
//       // Disable CSS transitions/animations that cause "ghosting"
//       const style = document.createElement('style');
//       style.innerHTML = `* { transition: none !important; animation: none !important; }`;
//       document.head.appendChild(style);
//     });

//     // Wait for the main content container to be visible
//     await page.waitForTimeout(4000); 

//     // Hide dynamic elements
//     for (const selector of ignoreSelectors) {
//       await page.evaluate((sel) => {
//         document.querySelectorAll(sel).forEach(el => el.style.visibility = "hidden");
//       }, selector).catch(() => {});
//     }

//     // Capture single, final screenshot
//     await page.screenshot({ path: livePath, animations: 'disabled' });
//     await browser.close();

//     // Comparison logic
//     const liveBuffer = await sharp(livePath).extract({ left: 0, top: 0, width, height }).raw().ensureAlpha().toBuffer();
//     const designRaw = await sharp(baselineBuffer).raw().ensureAlpha().toBuffer();

//     const diffDir = path.join(process.cwd(), 'data', 'diffs');
//     await fs.mkdir(diffDir, { recursive: true });
//     const diffPath = path.join(diffDir, `diff-${timestamp}.png`);
//     const diff = Buffer.alloc(width * height * 4);
    
//     const diffPixels = pixelmatch(designRaw, liveBuffer, diff, width, height, { threshold: 0.2, includeAA: false });
//     await sharp(diff, { raw: { width, height, channels: 4 } }).toFile(diffPath);

//     const totalPixels = width * height;
//     const score = parseFloat((((totalPixels - diffPixels) / totalPixels) * 100).toFixed(2));
    
//     let status = score > 85 ? "PASS" : (score >= 75 ? "NEED IMPROVEMENT" : "FAIL");

//     return { score: score.toFixed(2), status, baselinePath, livePath: path.relative(process.cwd(), livePath), diffPath: path.relative(process.cwd(), diffPath) };
//   } catch (err) {
//     console.error("Engine Error:", err);
//     throw new Error(`Could not process visual test: ${err.message}`);
//   }
// }
import path from "path";

import { analyzeBaseline } from "./baselineAnalyzer.js";
import { createBrowser, createContext } from "./browser.js";
import { stabilizePage } from "./pageStabilizer.js";
import { analyzeDOM } from "./domAnalyzer.js";
import { freezeDynamicElements } from "./freezeDynamic.js";
import { maskRegions } from "./regionMasker.js";
import { captureScreenshot } from "./screenshot.js";
import { compareImages } from "./comparator.js";
import { detectClusters } from "../smartDifference/clusterDetector.js";
import { mergeBoundingBoxes } from "../smartDifference/boundingBoxMerger.js";
import { generateCrops } from "../smartDifference/cropGenerator.js";
import { identifySections } from "../smartDifference/sectionIdentifier.js";
import { generateIssues } from "../smartDifference/issueGenerator.js";
import { analyzeDifferences } from "./differenceAnalyzer.js";
import { generateReport } from "./reportGenerator.js";

export async function runVisualTest(
  url,
  baselinePath,
  ignoreSelectors = []
) {
  if (!url) throw new Error("URL is required.");
  if (!baselinePath) throw new Error("Baseline image is required.");

  let browser;

  const startTime = Date.now();

  try {
    // =====================================================
    // 1. Analyze Baseline
    // =====================================================

    const baseline = await analyzeBaseline(baselinePath);

    console.log("\n========================================");
    console.log("QA Sentinel Visual Test");
    console.log("========================================");
    console.log("URL:", url);
    console.log("Baseline:", baselinePath);
    console.log(
      "Viewport:",
      `${baseline.viewport.width} x ${baseline.viewport.height}`
    );
    console.log("Page Type:", baseline.page.type);
    console.log("Device:", baseline.page.device);
    console.log("========================================\n");

    // =====================================================
    // 2. Launch Browser
    // =====================================================

    browser = await createBrowser();

    const context = await createContext(
      browser,
      baseline.viewport.width
    );

    const page = await context.newPage();

    // =====================================================
    // 3. Debug Events
    // =====================================================

    page.on("console", (msg) => {
      console.log("[Browser]", msg.text());
    });

    page.on("pageerror", (err) => {
      console.error("[Page Error]", err.message);
    });

    page.on("requestfailed", (request) => {
      console.warn(
        "[Request Failed]",
        request.url(),
        request.failure()?.errorText
      );
    });

    // =====================================================
    // 4. Open Website
    // =====================================================

    console.log("Opening:", url);

    await page.goto(url, {
      waitUntil: "load",
      timeout: 90000,
    });

    // =====================================================
    // 5. Stabilize Page
    // =====================================================

    await stabilizePage(page, ignoreSelectors);

    // =====================================================
    // 6. Analyze DOM
    // =====================================================

    const detectedComponents = await analyzeDOM(page);

    // =====================================================
    // 7. Freeze Dynamic Elements
    // =====================================================

    await freezeDynamicElements(page, detectedComponents);

    // =====================================================
    // 8. Mask Dynamic Regions
    // =====================================================

    const maskedRegions = await maskRegions(
      page,
      ignoreSelectors
    );

    // =====================================================
    // 9. Capture Screenshot
    // =====================================================

    const {
      path: livePath,
      timestamp,
    } = await captureScreenshot(page);

    // =====================================================
    // 10. Compare Images
    // =====================================================

    // =====================================================
// 10. Compare Images
// =====================================================

const comparison = await compareImages(
  baselinePath,
  livePath
);

// ----------------------------
// Detect changed regions
// ----------------------------

const clusterResult = await detectClusters(
  comparison.diffPath
);

// ----------------------------
// Merge nearby regions
// ----------------------------

const mergedBoxes = mergeBoundingBoxes(
  clusterResult.clusters
);

// ----------------------------
// Generate crops
// ----------------------------

const crops = await generateCrops({
  baselinePath: path.resolve(process.cwd(), baselinePath),
  livePath,
  diffPath: path.resolve(process.cwd(), comparison.diffPath),
  boxes: mergedBoxes,
});

// ----------------------------
// Match regions to DOM sections
// ----------------------------

const boxesWithSections = await identifySections(
  page,
  mergedBoxes
);

// ----------------------------
// Combine crops with regions
// ----------------------------

const smartRegions = boxesWithSections.map((box, index) => ({
  ...box,
  ...(crops[index] || {}),
}));

// ----------------------------
// Generate Smart Issues
// ----------------------------

const issueReport = generateIssues({
  regions: smartRegions,
  comparison,
});

    // =====================================================
    // 11. Analyze Differences
    // =====================================================

    const analysis = analyzeDifferences({
      score: comparison.score,
      stats: comparison.stats,
      ignoredRegions: ignoreSelectors,
      maskedRegions,
    });

    // =====================================================
    // 12. Generate Report
    // =====================================================
const report = generateReport({
  url,

  baselinePath: path.resolve(process.cwd(), baselinePath),

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

  detectedComponents,

  executionTime: Date.now() - startTime,
});
    console.log("\n========================================");
    console.log("Visual Test Completed");
    console.log("Score :", report.summary.score);
    console.log("Status:", report.summary.status);
    console.log("========================================\n");

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