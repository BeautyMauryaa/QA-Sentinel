import express from "express";
import { chromium } from "playwright";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import multer from "multer";
import db from "./db.js";
import { executeRun, SCREENSHOT_DIR } from "./runner.js";
import { compareRuns } from "./compare.js";
import { SUITES } from "./suiteRegistry.js";
import {
  extractDocxBlocks,
  extractUrlBlocks,
  compareBlocks,
} from "./contentMatchEngine.js";

import {
  captureScreenshots,
  saveBaseline,
  getBaseline,
  listBaselines,
  deleteBaseline,
  runVisualComparison,
  BASELINE_DIR,
  DIFF_DIR,
} from "./visualRegression.js"


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use("/screenshots", express.static(SCREENSHOT_DIR)); // already exists
app.use("/baselines",   express.static(BASELINE_DIR));   // ← add
app.use("/diffs",       express.static(DIFF_DIR));       // ← add


const PORT = process.env.PORT || 4000;

// Multer for .docx uploads (memory storage — no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.endsWith(".docx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are accepted."));
    }
  },
});

async function checkAuthentication(url, auth) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      httpCredentials:
        auth?.username && auth?.password
          ? { username: auth.username, password: auth.password }
          : undefined,
    });
    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    const status = response?.status() ?? 0;
    return { status, requiresAuth: status === 401 };
  } catch (err) {
    return { status: 0, requiresAuth: false, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

// --- Metadata -----------------------------------------------------------------

app.get("/api/suites", (req, res) => {
  res.json(SUITES.map((s) => ({ id: s.id, label: s.label })));
});

// --- Run tests ----------------------------------------------------------------

app.post("/api/tests/run", upload.single("document"), async (req, res) => {
  const url = req.body.url;
  const suites = JSON.parse(req.body.suites || "[]");
  const auth = {
    username: req.body.username,
    password: req.body.password,
  };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Field 'url' is required." });
  }

  let normalizedUrl;
  try {
    normalizedUrl = new URL(url).toString();
  } catch {
    return res.status(400).json({
      error:
        "Field 'url' must be a valid absolute URL, e.g. https://example.com",
    });
  }

  const suiteIds =
    Array.isArray(suites) && suites.length > 0
      ? suites
      : SUITES.map((s) => s.id);

  const invalidSuites = suiteIds.filter((id) => !SUITES.find((s) => s.id === id));
  if (invalidSuites.length > 0) {
    return res
      .status(400)
      .json({ error: `Unknown suite id(s): ${invalidSuites.join(", ")}` });
  }

  const authCheck = await checkAuthentication(normalizedUrl, auth);

  if (authCheck.requiresAuth && (!auth?.username || !auth?.password)) {
    return res.status(401).json({
      error:
        "This website requires authentication. Please enter username and password.",
    });
  }

  if (auth?.username && auth?.password && authCheck.status === 401) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const runId = nanoid();
  db.insertRun({
    id: runId,
    url: normalizedUrl,
    suites: suiteIds,
    status: "queued",
    passed: 0,
    failed: 0,
    skipped: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
  });

  res.status(202).json({ runId, status: "queued" });
  executeRun(runId, normalizedUrl, suiteIds, auth);
});

// --- Regression comparison ----------------------------------------------------
// MUST be before /api/tests/:id to avoid "compare" matching :id

app.get("/api/tests/compare", (req, res) => {
  const { run1, run2 } = req.query;
  if (!run1 || !run2) {
    return res
      .status(400)
      .json({ error: "Query params 'run1' and 'run2' are required." });
  }
  if (!db.getRun(run1) || !db.getRun(run2)) {
    return res.status(404).json({ error: "One or both run ids not found." });
  }
  res.json(compareRuns(run1, run2));
});

// --- Run status / results -----------------------------------------------------

app.get("/api/tests/:id", (req, res) => {
  const run = db.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  const results = db.getResults(req.params.id);
  res.json({ ...run, results });
});

// --- History ------------------------------------------------------------------

app.get("/api/history", (req, res) => {
  res.json(db.getHistory());
});

app.delete("/api/history/:id", (req, res) => {
  const runId = req.params.id;
  const deleted = db.deleteRun(runId);
  if (!deleted) return res.status(404).json({ error: "Run not found" });

  const screenshotDir = path.join(SCREENSHOT_DIR, runId);
  fs.rmSync(screenshotDir, { recursive: true, force: true });
  res.json({ success: true });
});

// --- Content Match Engine -----------------------------------------------------

app.post("/api/content-match", upload.single("docx"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "A .docx file is required (field name: 'docx')." });
  }

  const { url, username, password } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Field 'url' is required." });
  }

  let normalizedUrl;
  try {
    normalizedUrl = new URL(url).toString();
  } catch {
    return res.status(400).json({
      error:
        "Field 'url' must be a valid absolute URL, e.g. https://example.com",
    });
  }

  try {
    const auth =
      username && password ? { username, password } : undefined;

    const [docxBlocks, urlBlocks] = await Promise.all([
      extractDocxBlocks(req.file.buffer),
      extractUrlBlocks(normalizedUrl, auth),
    ]);

    const report = compareBlocks(docxBlocks, urlBlocks);

    res.json({
      url: normalizedUrl,
      filename: req.file.originalname,
      ...report,
    });
  } catch (err) {
    console.error("Content match error:", err);
    res.status(500).json({ error: err.message || "Content match failed." });
  }
});

// --- Visual Regression --------------------------------------------------------

app.post("/api/visual/baseline", async (req, res) => {
  const { url, username, password } = req.body || {};
  if (!url) return res.status(400).json({ error: "Field 'url' is required." });
  let normalizedUrl;
  try { normalizedUrl = new URL(url).toString(); }
  catch { return res.status(400).json({ error: "Invalid URL." }); }
  try {
    const auth = username && password ? { username, password } : undefined;
    const screenshots = await captureScreenshots(normalizedUrl, auth);
    const manifest    = saveBaseline(normalizedUrl, screenshots);
    res.json({ success: true, manifest });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to capture baseline." });
  }
});

app.get("/api/visual/baseline", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Query param 'url' is required." });
  const manifest = getBaseline(url);
  if (!manifest) return res.status(404).json({ error: "No baseline found." });
  res.json(manifest);
});

app.get("/api/visual/baselines", (req, res) => {
  res.json(listBaselines());
});

app.delete("/api/visual/baseline", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Query param 'url' is required." });
  const deleted = deleteBaseline(url);
  if (!deleted) return res.status(404).json({ error: "No baseline found." });
  res.json({ success: true });
});

app.post("/api/visual/compare", async (req, res) => {
  const { url, username, password } = req.body || {};
  if (!url) return res.status(400).json({ error: "Field 'url' is required." });
  let normalizedUrl;
  try { normalizedUrl = new URL(url).toString(); }
  catch { return res.status(400).json({ error: "Invalid URL." }); }
  const baseline = getBaseline(normalizedUrl);
  if (!baseline) return res.status(404).json({ error: "No baseline found. Capture a baseline first." });
  try {
    const auth   = username && password ? { username, password } : undefined;
    const runId  = nanoid();
    const result = await runVisualComparison(normalizedUrl, auth, runId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Visual comparison failed." });
  }
});

app.listen(PORT, () => {
  console.log(`QA Sentinel backend listening on http://localhost:${PORT}`);
});