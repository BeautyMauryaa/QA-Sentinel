// Suite 14: Content Verification
export const id = "content";
export const label = "Content Verification";

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /\bcoming soon\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /\bplaceholder\b/i,
  /\bexample\.com\b/i,
];

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const hasHeading = await page.$("h1");
  results.push(
    hasHeading
      ? record("TC_081", "Main Heading Exists", "pass")
      : record("TC_081", "Main Heading Exists", "fail", "No <h1> found on page")
  );

  const paragraphCount = await page.$$eval("p", (els) => els.filter((p) => p.innerText.trim().length > 10).length);
  results.push(
    paragraphCount > 0
      ? record("TC_082", "Paragraph Content Exists", "pass", `${paragraphCount} paragraph(s) with content`)
      : record("TC_082", "Paragraph Content Exists", "fail", "No <p> elements with meaningful text found")
  );

  const emptySections = await page.$$eval("section, [class*='section']", (els) =>
    els.filter((s) => s.innerText.trim().length === 0).length
  );
  results.push(
    emptySections === 0
      ? record("TC_083", "No Empty Sections", "pass")
      : record("TC_083", "No Empty Sections", "fail", `${emptySections} empty <section>/[class*=section] element(s)`)
  );

  const bodyText = await page.evaluate(() => document.body.innerText);
  const ctaWords = ["get started", "contact us", "learn more", "sign up", "buy now", "book now", "request demo", "call now"];
  const hasCtaText = ctaWords.some((w) => bodyText.toLowerCase().includes(w));
  results.push(
    hasCtaText
      ? record("TC_084", "Expected CTA Text Exists", "pass")
      : record("TC_084", "Expected CTA Text Exists", "fail", "No common CTA phrase found in page text (heuristic)")
  );

  const placeholderHits = PLACEHOLDER_PATTERNS.filter((p) => p.test(bodyText));
  results.push(
    placeholderHits.length === 0
      ? record("TC_085", "No Placeholder Content", "pass")
      : record("TC_085", "No Placeholder Content", "fail", `Matched: ${placeholderHits.map((p) => p.source).join(", ")}`)
  );

  return results;
}
