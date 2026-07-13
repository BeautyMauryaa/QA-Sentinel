import { chromium } from "playwright";
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import fs from "fs/promises";
import path from "path";

export async function runVisualTest(url, baselinePath, ignoreSelectors = []) {
  const browser = await chromium.launch();
  
  // 1. Get baseline dimensions from stored file
  const baselineBuffer = await fs.readFile(baselinePath);
  const { width, height } = await sharp(baselineBuffer).metadata();

  // 2. Setup Playwright with exact dimensions
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  // 3. Hide Dynamic Regions
  for (const selector of ignoreSelectors) {
    await page.evaluate((sel) => {
      document.querySelectorAll(sel).forEach(el => el.style.visibility = "hidden");
    }, selector);
  }

  // 4. Capture and crop
  const livePath = path.join('data', 'screenshots', `live-${Date.now()}.png`);
  await page.screenshot({ path: livePath });
  await browser.close();

  const liveBuffer = await sharp(livePath)
    .extract({ left: 0, top: 0, width, height })
    .raw().ensureAlpha().toBuffer();
    
  const designRaw = await sharp(baselineBuffer)
    .raw().ensureAlpha().toBuffer();

  // 5. Compare
  const diffPath = path.join('data', 'diffs', `diff-${Date.now()}.png`);
  const diff = Buffer.alloc(width * height * 4);
  const diffPixels = pixelmatch(designRaw, liveBuffer, diff, width, height, { threshold: 0.15, includeAA: false });

  await sharp(diff, { raw: { width, height, channels: 4 } }).toFile(diffPath);

  return {
    score: (((width * height - diffPixels) / (width * height)) * 100).toFixed(2),
    diffPath,
    livePath
  };
}