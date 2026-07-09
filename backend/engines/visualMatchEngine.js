import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";

export async function runVisualComparison(url, auth, runId, baselineBuffer, viewport = { width: 1920, height: 1080 }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: viewport,
    ignoreHTTPSErrors: true,
    httpCredentials: auth?.username && auth?.password ? { username: auth.username, password: auth.password } : undefined,
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  
  const liveScreenshotPath = path.join("./data/diffs", `live-${runId}.png`);
  await page.screenshot({ path: liveScreenshotPath, fullPage: true });
  await browser.close();

  // 1. Process Baseline and Live Image with Sharp
  const baselineMetadata = await sharp(baselineBuffer).metadata();
  
  // Resize live screenshot to match baseline dimensions for pixel-by-pixel comparison
  const liveResizedBuffer = await sharp(liveScreenshotPath)
    .resize(baselineMetadata.width, baselineMetadata.height)
    .toBuffer();

  // 2. Prepare PNG objects
  const imgBaseline = PNG.sync.read(baselineBuffer);
  const imgLive = PNG.sync.read(liveResizedBuffer);
  
  const { width, height } = imgBaseline;
  const diff = new PNG({ width, height });

  // 3. Perform Comparison
  const diffPixels = pixelmatch(imgBaseline.data, imgLive.data, diff.data, width, height, { threshold: 0.15 });
  
  // 4. Calculate Stats
  const totalPixels = width * height;
  const matchScore = (((totalPixels - diffPixels) / totalPixels) * 100).toFixed(1);
  
  const diffFileName = `diff-${runId}.png`;
  const diffPath = path.join("./data/diffs", diffFileName);
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  // Cleanup
  if (fs.existsSync(liveScreenshotPath)) fs.unlinkSync(liveScreenshotPath);

  return { 
    matchScore: parseFloat(matchScore), 
    diffUrl: `/diffs/${diffFileName}`,
    totalPixels,
    diffPixels
  };
}