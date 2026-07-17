import { analyzeBaseline } from "../baselineAnalyzer.js";
import { createBrowser, createContext } from "../browser.js";
import { stabilizePage } from "../pageStabilizer.js";

export async function preparationStage({
  url,
  baselinePath,
  ignoreSelectors = []
}) {

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

  const browser = await createBrowser();

  const context = await createContext(
    browser,
    baseline.viewport.width
  );

  const page = await context.newPage();

  // Debug events
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

  console.log("Opening:", url);

  await page.goto(url, {
    waitUntil: "load",
    timeout: 90000,
  });

  await stabilizePage(page, ignoreSelectors);

  return {
    browser,
    context,
    page,
    baseline
  };
}