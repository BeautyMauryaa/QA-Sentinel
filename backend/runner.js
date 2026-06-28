import { chromium } from "playwright";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";
import { SUITE_MAP } from "./suiteRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, "data", "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function makeHelpers(runId) {
  let counter = 0;
  return {
    record(test_id, test_name, status, error_message, screenshot_path) {
      return { test_id, test_name, status, error_message: error_message || null, screenshot_path: screenshot_path || null };
    },
    async screenshot(page, testId) {
      try {
        const runDir = path.join(SCREENSHOT_DIR, runId);
        fs.mkdirSync(runDir, { recursive: true });
        const filename = `${testId}_${counter++}.png`;
        const fullPath = path.join(runDir, filename);
        await page.screenshot({ path: fullPath, fullPage: false, timeout: 5000 });
        return `/screenshots/${runId}/${filename}`;
      } catch {
        return null;
      }
    },
  };
}

export async function executeRun(
  runId,
  url,
  suiteIds,
  auth
) {
  db.updateRun(runId, { status: "running" });

  let browser;
  let passed = 0,
    failed = 0,
    skipped = 0;

  try {
 browser = await chromium.launch({
  headless: true,
});

const context = await browser.newContext({
  ignoreHTTPSErrors: true,

  httpCredentials:
    auth?.username && auth?.password
      ? {
          username: auth.username,
          password: auth.password,
        }
      : undefined,
});

const page = await context.newPage();
    const helpers = makeHelpers(runId);

    for (const suiteId of suiteIds) {
      const suite = SUITE_MAP[suiteId];
      if (!suite) continue;

      let suiteResults = [];
      try {
        suiteResults = await suite.run(page, url, helpers);
      } catch (err) {
        // If an entire suite throws unexpectedly, record one failure for visibility
        suiteResults = [
          {
            test_id: `${suiteId}_ERROR`,
            test_name: `${suite.label} suite crashed`,
            status: "fail",
            error_message: err.message,
            screenshot_path: null,
          },
        ];
      }

      for (const r of suiteResults) {
        db.insertResult({
          id: nanoid(),
          run_id: runId,
          suite_id: suiteId,
          test_id: r.test_id,
          test_name: r.test_name,
          status: r.status,
          error_message: r.error_message,
          screenshot_path: r.screenshot_path,
        });
        if (r.status === "pass") passed++;
        else if (r.status === "fail") failed++;
        else skipped++;
      }

      // surface incremental progress immediately rather than waiting for the whole run
      db.updateRun(runId, { passed, failed, skipped });
    }

    db.updateRun(runId, { status: "completed", passed, failed, skipped, completed_at: new Date().toISOString() });
  } catch (err) {
    db.updateRun(runId, { status: "failed", passed, failed, skipped, completed_at: new Date().toISOString() });
    console.error(`Run ${runId} failed:`, err);
  } finally {
    if (browser) await browser.close();
    db.flush();
  }
}

export { SCREENSHOT_DIR };
