/**
 * Content Match Engine
 * Extracts blocks from DOCX + live URL, then compares them side-by-side
 * like Copyscape — fold/section grouped, with word-count match in the middle.
 */

import mammoth from "mammoth";
import { chromium } from "playwright";

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Simple word-overlap similarity (no external deps) ────────────────────────

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

// ─── Extract blocks from DOCX ─────────────────────────────────────────────────

export async function extractDocxBlocks(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const blocks = [];
  let currentSection = "Document";
  let sectionIndex = 0;

  for (const line of lines) {
    // Heuristic: short ALL-CAPS or Title Case lines with few words = section header
    const isLikelySectionHeader =
      line.length < 80 &&
      (line === line.toUpperCase() ||
        (line.split(" ").length <= 6 && /^[A-Z]/.test(line) && !line.endsWith(".")));

    if (isLikelySectionHeader && blocks.length > 0) {
      currentSection = line;
      sectionIndex++;
    }

    blocks.push({
      text: line,
      type: isLikelySectionHeader ? "heading" : "paragraph",
      section: currentSection,
      sectionIndex,
      words: wordCount(line),
    });
  }

  return blocks;
}

// ─── Extract blocks from live URL via Playwright ──────────────────────────────

export async function extractUrlBlocks(url, auth) {
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const blocks = await page.evaluate(() => {
      const results = [];

      // Map of semantic landmark → section name
      const SECTION_SELECTORS = [
        { sel: "header, [role='banner']", name: "Header" },
        { sel: "nav, [role='navigation']", name: "Navigation" },
        { sel: "section, article, main, [role='main']", name: null }, // use aria-label or index
        { sel: "footer, [role='contentinfo']", name: "Footer" },
      ];

      const TEXT_SELECTORS = "h1,h2,h3,h4,h5,h6,p,li,button,a,label,span,td,th,figcaption";

      function isVisible(el) {
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return (
          r.width > 0 &&
          r.height > 0 &&
          s.visibility !== "hidden" &&
          s.display !== "none" &&
          s.opacity !== "0"
        );
      }

      function isHeading(el) {
        return /^H[1-6]$/.test(el.tagName);
      }

      function getDirectText(el) {
        let t = "";
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) t += node.textContent;
        }
        return t.trim();
      }

      const sections = [];

      // Named landmark sections first
      const landmarks = [
        ...document.querySelectorAll(
          "header, nav, main, section, article, aside, footer, [role='banner'], [role='main'], [role='contentinfo'], [role='navigation']"
        ),
      ];

      if (landmarks.length > 0) {
        landmarks.forEach((lm, idx) => {
          const tag = lm.tagName.toLowerCase();
          const ariaLabel = lm.getAttribute("aria-label") || lm.getAttribute("aria-labelledby");
          const dataSection = lm.getAttribute("data-section") || lm.getAttribute("id");
          let sectionName =
            ariaLabel ||
            (tag === "header" ? "Header" : null) ||
            (tag === "nav" ? "Navigation" : null) ||
            (tag === "footer" ? "Footer" : null) ||
            (dataSection ? dataSection.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null) ||
            `Section ${idx + 1}`;

          sections.push({ el: lm, name: sectionName, index: idx });
        });
      } else {
        // Fallback: treat whole body as one section
        sections.push({ el: document.body, name: "Page Content", index: 0 });
      }

      const seen = new Set();

      for (const { el: sectionEl, name: sectionName, index: sectionIndex } of sections) {
        const textEls = sectionEl.querySelectorAll(TEXT_SELECTORS);
        for (const el of textEls) {
          if (!isVisible(el)) continue;
          const text = (getDirectText(el) || el.innerText || "").trim();
          if (!text || text.length < 3) continue;
          if (seen.has(text)) continue;
          seen.add(text);

          results.push({
            text,
            type: isHeading(el) ? "heading" : "paragraph",
            section: sectionName,
            sectionIndex,
            words: text.split(/\s+/).filter(Boolean).length,
          });
        }
      }

      return results;
    });

    return blocks;
  } finally {
    if (browser) await browser.close();
  }
}

// ─── Compare blocks ───────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 60; // % similarity to count as a match

export function compareBlocks(docBlocks, webBlocks) {
  const webTexts = webBlocks.map((b) => b.text);
  const usedWebIndices = new Set();

  // For each doc block, find best web match
  const rows = docBlocks.map((docBlock) => {
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < webTexts.length; i++) {
      const score = similarity(docBlock.text, webTexts[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const matched = bestScore >= MATCH_THRESHOLD && bestIdx !== -1;
    if (matched) usedWebIndices.add(bestIdx);

    const webBlock = matched ? webBlocks[bestIdx] : null;
    const matchWords = matched
      ? Math.min(docBlock.words, webBlock.words)
      : 0;

    return {
      docText: docBlock.text,
      docWords: docBlock.words,
      docSection: docBlock.section,
      docSectionIndex: docBlock.sectionIndex,
      docType: docBlock.type,
      webText: webBlock ? webBlock.text : null,
      webWords: webBlock ? webBlock.words : 0,
      webSection: webBlock ? webBlock.section : null,
      matchWords,
      score: bestScore,
      status: matched ? (bestScore === 100 ? "exact" : "fuzzy") : "missing",
    };
  });

  // Web blocks not matched to any doc block = "extra"
  const extraRows = webBlocks
    .filter((_, i) => !usedWebIndices.has(i))
    .map((wb) => ({
      docText: null,
      docWords: 0,
      docSection: null,
      docSectionIndex: null,
      docType: null,
      webText: wb.text,
      webWords: wb.words,
      webSection: wb.section,
      matchWords: 0,
      score: 0,
      status: "extra",
    }));

  // Stats
  const totalDocBlocks = rows.length;
  const matched = rows.filter((r) => r.status !== "missing").length;
  const missing = rows.filter((r) => r.status === "missing").length;
  const exact = rows.filter((r) => r.status === "exact").length;
  const fuzzy = rows.filter((r) => r.status === "fuzzy").length;
  const extra = extraRows.length;

  const totalMatchWords = rows.reduce((s, r) => s + r.matchWords, 0);
  const totalDocWords = docBlocks.reduce((s, b) => s + b.words, 0);
  const totalWebWords = webBlocks.reduce((s, b) => s + b.words, 0);

  const score =
    totalDocBlocks === 0 ? 0 : Math.round((matched / totalDocBlocks) * 100);

  // Group all rows (doc + extra) by section for the side-by-side view
  // Group by docSection first, then append extra web blocks
  const sectionMap = new Map();

  for (const row of rows) {
    const key = row.docSection || "Document";
    if (!sectionMap.has(key)) sectionMap.set(key, { name: key, rows: [] });
    sectionMap.get(key).rows.push(row);
  }

  // Append extra web content as its own section
  if (extraRows.length > 0) {
    const extraSections = new Map();
    for (const row of extraRows) {
      const key = row.webSection || "Extra Web Content";
      if (!extraSections.has(key)) extraSections.set(key, { name: key, rows: [] });
      extraSections.get(key).rows.push(row);
    }
    for (const [, sec] of extraSections) {
      const key = `Extra: ${sec.name}`;
      sectionMap.set(key, { name: key, rows: sec.rows });
    }
  }

  return {
    score,
    totalMatchWords,
    totalDocWords,
    totalWebWords,
    summary: { matched, missing, exact, fuzzy, extra, total: totalDocBlocks },
    sections: [...sectionMap.values()],
    // flat lists for backward-compat with existing tabs
    matched: rows.filter((r) => r.status !== "missing"),
    missing: rows.filter((r) => r.status === "missing"),
    extra: extraRows,
  };
}