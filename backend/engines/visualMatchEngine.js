import { chromium } from "playwright";
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import fs from "fs/promises";
import path from "path";

export async function runVisualTest(url, baselinePath, ignoreSelectors = []) {
  if (!baselinePath) {
    throw new Error("Baseline path is undefined. Ensure the design file is selected.");
  }

  const fullBaselinePath = path.resolve(process.cwd(), baselinePath);

  try {
    // 1. Read Baseline
    const baselineBuffer = await fs.readFile(fullBaselinePath);
    const { width, height } = await sharp(baselineBuffer).metadata();

    // 2. Setup Playwright with increased timeout
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    
    // Use 'domcontentloaded' to avoid long-running network requests causing timeouts
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 3. Hide Dynamic Regions
    // Wait for the elements to be present before hiding them
    for (const selector of ignoreSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.evaluate((sel) => {
          document.querySelectorAll(sel).forEach(el => el.style.visibility = "hidden");
        }, selector);
      } catch (e) {
        console.warn(`Selector not found or timed out: ${selector}`);
      }
    }

    // 4. Manual Wait for animations/rendering stability
    await page.waitForTimeout(2000); 

    // 5. Capture Screenshot
    const timestamp = Date.now();
    const livePath = path.join('data', 'screenshots', `live-${timestamp}.png`);
    await page.screenshot({ path: livePath, fullPage: false });
    await browser.close();

    // 6. Processing Buffers
    const liveBuffer = await sharp(livePath)
      .extract({ left: 0, top: 0, width, height })
      .raw()
      .ensureAlpha()
      .toBuffer();
      
    const designRaw = await sharp(baselineBuffer)
      .raw()
      .ensureAlpha()
      .toBuffer();

    // 7. Comparison
    const diffPath = path.join('data', 'diffs', `diff-${timestamp}.png`);
    const diff = Buffer.alloc(width * height * 4);
    const diffPixels = pixelmatch(designRaw, liveBuffer, diff, width, height, { 
      threshold: 0.15, 
      includeAA: false 
    });

    await sharp(diff, { raw: { width, height, channels: 4 } }).toFile(diffPath);

    // 8. Result Calculation
    const totalPixels = width * height;
    const score = (((totalPixels - diffPixels) / totalPixels) * 100).toFixed(2);

    return {
      score,
      status: parseFloat(score) >= 95 ? "PASS" : "FAIL",
      baselinePath,
      livePath,
      diffPath,
      stats: {
        matchedPixels: totalPixels - diffPixels,
        diffPixels: diffPixels,
        totalPixels: totalPixels,
        time: "2.0s"
      }
    };
  } catch (err) {
    console.error("Engine Error:", err);
    throw new Error(`Could not process visual test: ${err.message}`);
  }
}