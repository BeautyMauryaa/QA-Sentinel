/**
 * engines/contentMatchEngine.js
 */
import { chromium } from "playwright";
import calculateStringSimilarity from "similarity";

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\u00a0/g, ' ') // Remove non-breaking spaces
    .replace(/['’‘]/g, "'")   // Standardize quotes
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Strip punctuation
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .trim();
}

function getLengthRatio(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  return len1 > len2 ? len1 / len2 : len2 / len1;
}

export async function extractUrlBlocks(url, auth) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    
    // Use 'networkidle' to ensure all JS-driven content is loaded
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    const blocks = await page.evaluate(() => {
      const results = [];
      // Added 'div' to selectors to capture custom styled headings
      const TEXT_SELECTORS = "h1,h2,h3,h4,h5,h6,p,li,button,a,label,span,td,th,div";
      const allEls = document.querySelectorAll(TEXT_SELECTORS);

      for (const el of allEls) {
        // Skip hidden elements that take up no space (often used for mobile/desktop toggles)
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        
        // Skip boilerplate containers
        if (el.closest('header, nav, footer, [role="navigation"]')) continue;
        
        let text = (el.innerText || "").replace(/\s+/g, " ").trim();
        
        // Capture divs only if they contain substantial text (prevents noise)
        if (el.tagName === 'DIV' && text.length < 20) continue; 
        
        if (text.length > 2) results.push({ text });
      }
      return results;
    });
    return blocks;
  } finally {
    if (browser) await browser.close();
  }
}

 export function evaluateContentMatch(sections, liveWebsiteContentArray) {
  const report = [];
  const normalizedLiveArray = liveWebsiteContentArray.map(t => ({ raw: t, clean: normalize(t) }));

  for (const section of sections) {
    const sectionReport = {
      sectionHeading: section.heading,
      results: [],
      status: "PASS"
    };

    for (const item of section.items) {
      const normalizedExpected = normalize(item.expected);
      if (!normalizedExpected) continue;

      let matchRecord = null;

     if (item.type === "Paragraph") {
        // Use a more restrictive match: the website text must contain the expected text
        // AND the length ratio must be tight.
        matchRecord = normalizedLiveArray.find(live => {
          const isContained = live.clean.includes(normalizedExpected);
          if (!isContained) return false;

          const ratio = getLengthRatio(live.clean, normalizedExpected);
          // Tightened ratio to 1.15 to ensure we get the full paragraph, not a fragment
          return ratio < 1.15; 
        });
      } else {
        // HEADING/CTA LOGIC: Must be an exact or near-exact match
        matchRecord = normalizedLiveArray.find(live => 
          calculateStringSimilarity(live.clean, normalizedExpected) > 0.90
        );
      }

      if (matchRecord) {
        sectionReport.results.push({
          label: item.type,
          expected: item.expected,
          actual: matchRecord.raw,
          status: "Match",
          issue: null
        });
      } else {
        // Fallback to Missing
        sectionReport.status = "FAIL";
        sectionReport.results.push({
          label: item.type,
          expected: item.expected,
          actual: "— Missing or Mismatched —",
          status: "Missing Content",
          issue: { type: "Missing Content", reason: "Blueprint string not found in DOM." }
        });
      }
    }
    report.push(sectionReport);
  }
  return report;
}