/**
 * engines/contentMatchEngine.js
 */
import { chromium } from "playwright";
import calculateStringSimilarity from "similarity";
function extractWords(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .replace(/\s+/g, " ") // Clean up double spaces
    .trim()
    .split(" ");
}
function normalize(text) {
  // If text is not a string, convert to empty string to avoid crashes
  const str = (typeof text === 'string') ? text : (text?.text || ""); 
  
  return str
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/['’‘]/g, "'")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, ' ')
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
    
    // 1. Prepare configuration with User-Agent and optional HTTP Credentials
    const contextOptions = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    if (auth?.username && auth?.password) {
      contextOptions.httpCredentials = {
        username: auth.username,
        password: auth.password
      };
    }

    // 2. Initialize context with the configuration options
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // 3. Navigate with timeout and wait for idle network
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    // 4. Extract content
    const blocks = await page.evaluate(() => {
      const results = [];
      const TEXT_SELECTORS = "h1,h2,h3,h4,h5,h6,p,li,button,a,label,span,td,th,div";
      const allEls = document.querySelectorAll(TEXT_SELECTORS);

      for (const el of allEls) {
        // Skip hidden elements
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;

        // Skip boilerplate
        if (el.closest('header, nav, footer, [role="navigation"]')) continue;

        // DE-DUPLICATION
        const parent = el.parentElement;
        if (parent && TEXT_SELECTORS.split(',').includes(parent.tagName.toLowerCase())) {
          const parentText = (parent.innerText || "").replace(/\s+/g, " ").trim();
          const currentText = (el.innerText || "").replace(/\s+/g, " ").trim();
          if (parentText === currentText) continue;
        }

        let text = (el.innerText || "").replace(/\s+/g, " ").trim();

        // Filter noise
        if (el.tagName === "DIV" && text.length < 20) continue;
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
  const normalizedLiveArray = liveWebsiteContentArray.map(item => ({
    raw: item.text || "",
    clean: normalize(item.text || "")
  }));

  for (const section of sections) {
    const sectionReport = { sectionHeading: section.heading, results: [], status: "PASS" };

    for (const item of section.items) {
      let status = "Match";
      let actualDisplay = "";

      if (item.type === "TechList") {
        const foundTechs = item.expected.filter(tech =>
          normalizedLiveArray.some(live => {
            const normTech = normalize(tech);
            return live.clean.includes(normTech) || normTech.includes(live.clean);
          })
        );
        const matchPercentage = foundTechs.length / (item.expected.length || 1);
        if (matchPercentage >= 0.5) {
          status = "Match";
          actualDisplay = foundTechs.join(", ");
        } else {
          status = "Mismatch";
          sectionReport.status = "FAIL";
          actualDisplay = foundTechs.length > 0 ? `Found: ${foundTechs.join(", ")}` : "— Missing —";
        }
      } else {
        // --- PARAGRAPH: TWO-STEP STRICT VERIFICATION ---
        
        // Step 1: Find the best matching block in the DOM
        const bestMatch = normalizedLiveArray.reduce((best, current) => {
          // Fallback to your string similarity to locate the container
          const sim = calculateStringSimilarity(current.clean, normalize(item.expected));
          return (sim > best.score) ? { score: sim, raw: current.raw } : best;
        }, { score: 0, raw: "— Missing —" });

        // Step 2: Strict Word-by-Word Analysis
        const expectedWords = extractWords(item.expected);
        const actualWords = extractWords(bestMatch.raw);
        
        let matchedWordCount = 0;
        for (const word of expectedWords) {
            const foundIndex = actualWords.indexOf(word);
            if (foundIndex !== -1) {
                matchedWordCount++;
                // Remove the word once matched to prevent double-counting
                actualWords.splice(foundIndex, 1); 
            }
        }

        // Calculate how many of our required words actually appeared
        const wordMatchRatio = matchedWordCount / (expectedWords.length || 1);

        // Require 98% exact word matches (Catches the missing "Gen" word)
        if (wordMatchRatio >= 0.98) {
            status = "Match";
        } else {
            status = "Mismatch";
            sectionReport.status = "FAIL";
        }
        
        // Always display what we found so the tester can visually compare the differences
        actualDisplay = bestMatch.raw;
      }

      sectionReport.results.push({
        label: item.type,
        expected: Array.isArray(item.expected) ? item.expected.join(", ") : item.expected,
        actual: actualDisplay,
        status: status,
      });
    }
    report.push(sectionReport);
  }
  return report;
}
