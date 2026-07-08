/**
 * engines/contentMatchEngine.js
 */
import { chromium } from "playwright";
import calculateStringSimilarity from "similarity";

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
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });
    const page = await context.newPage();

    // Use 'networkidle' to ensure all JS-driven content is loaded
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    const blocks = await page.evaluate(() => {
      const results = [];
      // Added 'div' to selectors to capture custom styled headings
      const TEXT_SELECTORS =
        "h1,h2,h3,h4,h5,h6,p,li,button,a,label,span,td,th,div";
      const allEls = document.querySelectorAll(TEXT_SELECTORS);

      for (const el of allEls) {
        // Skip hidden elements that take up no space (often used for mobile/desktop toggles)
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;

        // Skip boilerplate containers
        if (el.closest('header, nav, footer, [role="navigation"]')) continue;

        let text = (el.innerText || "").replace(/\s+/g, " ").trim();

        // Capture divs only if they contain substantial text (prevents noise)
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
  
  // Ensure we are mapping the text content property
  const normalizedLiveArray = liveWebsiteContentArray.map(item => ({
    raw: item.text || "",
    clean: normalize(item.text || "") 
  }));
for (const section of sections) {
    const sectionReport = {
      sectionHeading: section.heading,
      results: [],
      status: "PASS",
    };

    for (const item of section.items) {
      let matchRecord = null;
      let status = "Match";
      let actualDisplay = "";

      if (item.type === "TechList") {
        // Logic for TechList: Find matches for items in the array
        const foundTechs = item.expected.filter((tech) =>
          normalizedLiveArray.some((live) => live.clean.includes(normalize(tech)))
        );

        const matchPercentage = foundTechs.length / item.expected.length;
        
        if (matchPercentage >= 0.5) {
          matchRecord = { raw: foundTechs.join(", ") };
          actualDisplay = matchRecord.raw;
        } else {
          status = "Mismatch";
          actualDisplay = "— Missing or Mismatched —";
          sectionReport.status = "FAIL";
        }
      } else {
        // Logic for Paragraph/Heading: String similarity
        const normalizedExpected = normalize(item.expected);
        if (!normalizedExpected) continue;

        matchRecord = normalizedLiveArray.find((live) => 
          calculateStringSimilarity(live.clean, normalizedExpected) > 0.9
        );

        if (matchRecord) {
          actualDisplay = matchRecord.raw;
        } else {
          status = "Mismatch";
          sectionReport.status = "FAIL";
          
          // Find closest match for display
          const closestMatch = normalizedLiveArray.reduce((best, current) => {
            const sim = calculateStringSimilarity(current.clean, normalizedExpected);
            return (sim > best.score) ? { score: sim, raw: current.raw } : best;
          }, { score: 0, raw: "— Missing —" });
          
          actualDisplay = closestMatch.raw;
        }
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

// export function evaluateContentMatch(sections, liveWebsiteContentArray) {
//   const report = [];
//   const normalizedLiveArray = liveWebsiteContentArray.map(item => ({
//     raw: item.text || "",
//     clean: normalize(item.text || "")
//   }));

//   for (const section of sections) {
//     const sectionReport = { sectionHeading: section.heading, results: [], status: "PASS" };

//     for (const item of section.items) {
//       let status = "Match";
//       let actualDisplay = "";

//       if (item.type === "TechList") {
//         const foundTechs = item.expected.filter(tech =>
//           normalizedLiveArray.some(live => live.clean.includes(normalize(tech)))
//         );
//         status = (foundTechs.length / item.expected.length >= 0.5) ? "Match" : "Mismatch";
//         actualDisplay = foundTechs.join(", ");
//       } else {
//         // --- SENTENCE-LEVEL COMPARISON ---
//         const sentences = item.expected.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
//         // Find if the website content contains these sentences
//         const matchedSentences = sentences.filter(sentence => {
//           const normSent = normalize(sentence);
//           return normalizedLiveArray.some(live => live.clean.includes(normSent));
//         });

//         const score = matchedSentences.length / (sentences.length || 1);
        
//         if (score >= 0.6) { // 60% of sentences must match
//           status = "Match";
//           actualDisplay = item.expected; // Blueprint matches the essence
//         } else {
//           status = "Mismatch";
//           sectionReport.status = "FAIL";
//           // Find the best single block that contains our text
//           const bestMatch = normalizedLiveArray.reduce((prev, curr) => 
//             curr.clean.includes(normalize(item.expected.substring(0, 20))) ? curr : prev
//           , { raw: "— Missing —" });
//           actualDisplay = bestMatch.raw;
//         }
//       }

//       sectionReport.results.push({
//         label: item.type,
//         expected: Array.isArray(item.expected) ? item.expected.join(", ") : item.expected,
//         actual: actualDisplay,
//         status: status,
//       });
//     }
//     report.push(sectionReport);
//   }
//   return report;
// }
