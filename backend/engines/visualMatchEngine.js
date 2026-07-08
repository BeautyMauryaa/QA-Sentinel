import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";

const BASELINE_DIR = "./baselines"; // Figma exports go here
const DIFF_DIR = "./diffs";         // Comparison results go here

// Ensure directories exist
[BASELINE_DIR, DIFF_DIR].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir); });

export async function compareWithFigmaBaseline(url, designFilePath, runId) {
  // 1. Capture Live Screenshot
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const liveScreenshotPath = path.join(DIFF_DIR, `live-${runId}.png`);
  await page.screenshot({ path: liveScreenshotPath, fullPage: true });
  await browser.close();

  // 2. Load Images
  const imgLive = PNG.sync.read(fs.readFileSync(liveScreenshotPath));
  const imgBaseline = PNG.sync.read(fs.readFileSync(designFilePath));

  // 3. Prepare Diff Object
  const { width, height } = imgLive;
  const diff = new PNG({ width, height });

  // 4. Compare (Threshold 0.15 is good for Figma-to-Browser variance)
  const numDiffPixels = pixelmatch(
    imgLive.data, imgBaseline.data, diff.data, width, height,
    { threshold: 0.15 }
  );

  // 5. Save Diff
  const diffPath = path.join(DIFF_DIR, `diff-${runId}.png`);
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    numDiffPixels,
    diffUrl: `/diffs/diff-${runId}.png`
  };
}