/**
 * Visual Regression Engine
 * - Captures full-page screenshots per URL + key (page section label)
 * - Stores baselines in data/baselines/{hostname}/{key}.png
 * - Compares current screenshot against baseline using pixelmatch
 * - Generates a diff PNG with red highlights on changed pixels
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BASELINE_DIR = path.join(__dirname, "data", "baselines");
export const DIFF_DIR = path.join(__dirname, "data", "diffs");

fs.mkdirSync(BASELINE_DIR, { recursive: true });
fs.mkdirSync(DIFF_DIR, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hostnameSlug(url) {
  try {
    return new URL(url).hostname.replace(/[^a-z0-9.-]/gi, "_");
  } catch {
    return "unknown";
  }
}

function baselineDir(url) {
  const dir = path.join(BASELINE_DIR, hostnameSlug(url));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function diffDir(runId) {
  const dir = path.join(DIFF_DIR, runId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ─── Capture screenshots for a URL ───────────────────────────────────────────

const VIEWPORTS = [
  { key: "desktop", width: 1280, height: 800 },
  { key: "mobile", width: 390, height: 844 },
  { key: "tablet", width: 820, height: 1180 },
];

export async function captureScreenshots(url, auth) {
  let browser;
  const captured = [];

  try {
    browser = await chromium.launch({ headless: true });

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: { width: vp.width, height: vp.height },
        httpCredentials:
          auth?.username && auth?.password
            ? { username: auth.username, password: auth.password }
            : undefined,
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800); // let animations settle

      const buf = await page.screenshot({ fullPage: true });
      captured.push({
        key: vp.key,
        label: vp.key,
        buffer: buf,
        width: vp.width,
      });
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
  }

  return captured;
}

// ─── Save as baseline ─────────────────────────────────────────────────────────

export function saveBaseline(url, screenshots) {
  const dir = baselineDir(url);
  const saved = [];

  for (const s of screenshots) {
    const filePath = path.join(dir, `${s.key}.png`);
    fs.writeFileSync(filePath, s.buffer);
    saved.push({
      key: s.key,
      label: s.label,
      path: filePath,
      url: `/baselines/${hostnameSlug(url)}/${s.key}.png`,
      savedAt: new Date().toISOString(),
    });
  }

  // Write manifest
  const manifest = {
    url,
    hostname: hostnameSlug(url),
    capturedAt: new Date().toISOString(),
    screenshots: saved.map((s) => ({
      key: s.key,
      label: s.label,
      url: s.url,
      savedAt: s.savedAt,
    })),
  };
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  return manifest;
}

// ─── Get baseline manifest ────────────────────────────────────────────────────

export function getBaseline(url) {
  const dir = baselineDir(url);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

export function listBaselines() {
  if (!fs.existsSync(BASELINE_DIR)) return [];
  const results = [];
  for (const hostname of fs.readdirSync(BASELINE_DIR)) {
    const manifestPath = path.join(BASELINE_DIR, hostname, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        results.push(JSON.parse(fs.readFileSync(manifestPath, "utf-8")));
      } catch {}
    }
  }
  return results;
}

export function deleteBaseline(url) {
  const dir = baselineDir(url);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

// ─── Compare current screenshots against baseline ─────────────────────────────

export async function runVisualComparison(url, auth, runId) {
  const baseline = getBaseline(url);
  if (!baseline) {
    return {
      error: "No baseline found for this URL. Capture a baseline first.",
    };
  }

  const current = await captureScreenshots(url, auth);
  const dDir = diffDir(runId);
  const results = [];

  for (const curr of current) {
    const baselinePath = path.join(
      BASELINE_DIR,
      hostnameSlug(url),
      `${curr.key}.png`,
    );

    if (!fs.existsSync(baselinePath)) {
      results.push({
        key: curr.key,
        label: curr.label,
        status: "no_baseline",
        message: `No baseline for viewport: ${curr.key}`,
      });
      continue;
    }

    try {
      // Parse both PNGs
      const baselinePng = PNG.sync.read(fs.readFileSync(baselinePath));
      const currentPng = PNG.sync.read(curr.buffer);

      // Resize to same dimensions if needed (take the smaller)
      const width = Math.min(baselinePng.width, currentPng.width);
      const height = Math.min(baselinePng.height, currentPng.height);

      const diff = new PNG({ width, height });
      const numDiff = pixelmatch(
        baselinePng.data,
        currentPng.data,
        diff.data,
        width,
        height,
        { threshold: 0.1, includeAA: false },
      );

      const totalPixels = width * height;
      const diffPercent = parseFloat(
        ((numDiff / totalPixels) * 100).toFixed(2),
      );
      const status =
        diffPercent === 0 ? "pass" : diffPercent < 5 ? "minor" : "fail";

      // Save current + diff PNGs
      const currentPath = path.join(dDir, `${curr.key}_current.png`);
      const diffPath = path.join(dDir, `${curr.key}_diff.png`);
      fs.writeFileSync(currentPath, curr.buffer);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      results.push({
        key: curr.key,
        label: curr.label,
        status,
        diffPercent,
        diffPixels: numDiff,
        totalPixels,
        baselineUrl: `/baselines/${hostnameSlug(url)}/${curr.key}.png`,
        currentUrl: `/diffs/${runId}/${curr.key}_current.png`,
        diffUrl: `/diffs/${runId}/${curr.key}_diff.png`,
        baselineSize: { width: baselinePng.width, height: baselinePng.height },
        currentSize: { width: currentPng.width, height: currentPng.height },
      });
    } catch (err) {
      results.push({
        key: curr.key,
        label: curr.label,
        status: "error",
        message: err.message,
      });
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const minor = results.filter((r) => r.status === "minor").length;

  return {
    runId,
    url,
    comparedAt: new Date().toISOString(),
    baselineCapturedAt: baseline.capturedAt,
    summary: { passed, failed, minor, total: results.length },
    results,
  };
}
