import fs from "fs/promises";
import path from "path";

/**
 * Capture a full-page screenshot.
 *
 * @param {import("playwright").Page} page
 * @param {string} name Optional screenshot name
 * @returns {{path:string, timestamp:number}}
 */
export async function captureScreenshot(page, name = "live") {
  const timestamp = Date.now();

  const screenshotDir = path.join(
    process.cwd(),
    "data",
    "screenshots"
  );

  await fs.mkdir(screenshotDir, {
    recursive: true,
  });

  const screenshotPath = path.join(
    screenshotDir,
    `${name}-${timestamp}.png`
  );

  console.log("Capturing screenshot...");

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    type: "png",
    animations: "disabled",
    caret: "hide",
  });

  console.log("Screenshot saved:", screenshotPath);

  return {
    path: screenshotPath,
    timestamp,
  };
}