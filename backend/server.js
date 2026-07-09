import express from "express";
import { chromium } from "playwright";
import fs from "fs";
import cors from "cors";
import path from "path";
import sharp from 'sharp';
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import multer from "multer";
import db from "./db.js";
import { executeRun, SCREENSHOT_DIR } from "./runner.js";
import { compareRuns } from "./compare.js";
import { SUITES } from "./suiteRegistry.js";

// Import your custom extraction utils and your fixed match engine module
import { parseAndCleanDocument } from "./utils/docParser.js";
import {
  extractUrlBlocks,
  evaluateContentMatch,
} from "./engines/contentMatchEngine.js";
import mammoth from "mammoth";

import { runVisualComparison } from "./engines/visualMatchEngine.js";
const DIFF_DIR = path.join(process.cwd(), 'data', 'diffs');

// Create the folder if it doesn't exist
if (!fs.existsSync(DIFF_DIR)) {
  fs.mkdirSync(DIFF_DIR, { recursive: true });
}
//const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Multer for .docx uploads (Memory Storage with Safe Error Callback)
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
//   fileFilter(req, file, cb) {
//     const isDocxExt = file.originalname.toLowerCase().endsWith(".docx");
//     const isDocxMime =
//       file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//       file.mimetype === "application/octet-stream"; // Safe fallback for OS environment variance

//     if (isDocxExt || isDocxMime) {
//       cb(null, true);
//     } else {
//       cb(new MulterError("LIMIT_UNEXPECTED_FILE", "Only .docx files are accepted."), false);
//     }
//   },
// });

// --- File Upload Configuration ---
const docxUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (file.originalname.toLowerCase().endsWith(".docx")) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are accepted."), false);
    }
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are accepted."), false);
    }
  },
});

// Custom error wrapper to safely handle validation messages
class MulterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

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

const handleTestRunUpload = docxUpload.single("document");
app.post(
  "/api/tests/run",
  (req, res, next) => {
    handleTestRunUpload(req, res, function (err) {
      if (err) {
        return res
          .status(400)
          .json({ error: err.message || "File upload validation failed." });
      }
      next();
    });
  },
  async (req, res) => {
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

    const invalidSuites = suiteIds.filter(
      (id) => !SUITES.find((s) => s.id === id),
    );
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

    // Remove the restrictive global upload middleware if you have one
    // Instead, use these specific instances:

    // For .docx files
    const docxUpload = multer({
      storage: multer.memoryStorage(),
      fileFilter(req, file, cb) {
        if (file.originalname.toLowerCase().endsWith(".docx")) {
          cb(null, true);
        } else {
          cb(new Error("Only .docx files are accepted."), false);
        }
      },
    });

    // For images (Visual Comparison)
    const imageUpload = multer({
      storage: multer.memoryStorage(),
      fileFilter(req, file, cb) {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Only image files are accepted."), false);
        }
      },
    });

    res.status(202).json({ runId, status: "queued" });
    executeRun(runId, normalizedUrl, suiteIds, auth);
  },
);

// --- Regression comparison ----------------------------------------------------

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
// Update this route specifically
app.post("/api/visual/compare", imageUpload.single("design"), async (req, res) => {
  try {
    const { url, username, password, width, height } = req.body; // Add width/height
    
    if (!req.file) return res.status(400).json({ error: "No image file uploaded." });
    if (!url) return res.status(400).json({ error: "URL is required." });

    const runId = nanoid();
    // Parse viewport dimensions safely
    const viewport = { 
      width: parseInt(width) || 1920, 
      height: parseInt(height) || 1080 
    };
    
    // Pass viewport to your engine
    const result = await runVisualComparison(url, { username, password }, runId, req.file.buffer, viewport);
    res.json(result);
  } catch (err) {
    console.error("CRITICAL BACKEND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/diffs', express.static(path.join(process.cwd(), 'data', 'diffs')));

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
// --- Content Match Engine -----------------------------------------------------

const handleContentMatchUpload = docxUpload.single("docx");
app.post(
  "/api/content-match",
  (req, res, next) => {
    handleContentMatchUpload(req, res, function (err) {
      if (err) {
        return res
          .status(400)
          .json({ error: err.message || "File upload validation failed." });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "A .docx file is required." });
    }

    const { url, username, password } = req.body || {};
    if (!url)
      return res.status(400).json({ error: "Field 'url' is required." });

    try {
      const auth = username && password ? { username, password } : undefined;

      // 1. Extract text from DOCX
      const docxExtractionResult = await mammoth.extractRawText({
        buffer: req.file.buffer,
      });
      const rawLines = docxExtractionResult.value.split("\n");
      const cleanStructuredSections = parseAndCleanDocument(rawLines);

      // 2. Fetch DOM content (The Scraper)
      const webBlocks = await extractUrlBlocks(url, auth);

      // DEBUG: Log the result to see if it's empty
      console.log("DEBUG: Web Blocks length:", webBlocks?.length);

      // 3. Evaluate and send report
      const reportData = evaluateContentMatch(
        cleanStructuredSections,
        webBlocks,
      );

      res.json({
        url: url,
        filename: req.file.originalname,
        reportData,
      });
    } catch (err) {
      console.error("Content match error:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

// Add to your server.js
app.get("/api/report/download", (req, res) => {
  // Replace this with how you store your latest report in your backend
  const reportData = global.latestReportData;

  if (!reportData) {
    return res
      .status(404)
      .json({ error: "No report data available to download." });
  }

  // Set headers to trigger a file download
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="qa-report.json"');
  res.send(JSON.stringify(reportData, null, 2));
});

app.listen(PORT, () => {
  console.log(`QA Sentinel backend listening on http://127.0.0.1:${PORT}`);
});
