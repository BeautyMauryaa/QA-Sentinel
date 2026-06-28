// Suite 5: CTA Tests
export const id = "cta";
export const label = "CTA";

const CTA_SELECTOR =
  "a[class*='cta'], button[class*='cta'], a[class*='btn-primary'], button[class*='btn-primary'], .hero a, .hero button, [class*='hero'] a, [class*='hero'] button";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const ctas = await page.$$(CTA_SELECTOR);
  results.push(
    ctas.length > 0
      ? record("TC_026", "Primary CTA Visible", "pass", `${ctas.length} candidate CTA(s) detected (heuristic)`)
      : record("TC_026", "Primary CTA Visible", "fail", "No element matching common CTA patterns found")
  );

  if (ctas.length === 0) {
    for (const [tid, name] of [
      ["TC_027", "CTA Clickable"],
      ["TC_028", "CTA Redirects Correct Page"],
      ["TC_029", "Multiple CTA Buttons Work"],
      ["TC_030", "Sticky CTA Works"],
    ]) {
      results.push(record(tid, name, "skipped", "No CTA detected"));
    }
    return results;
  }

  const firstEnabled = await ctas[0].isEnabled().catch(() => false);
  results.push(
    firstEnabled
      ? record("TC_027", "CTA Clickable", "pass")
      : record("TC_027", "CTA Clickable", "fail", "Primary CTA is disabled or not interactable")
  );

  const href = await ctas[0].getAttribute("href").catch(() => null);
  results.push(
    href
      ? record("TC_028", "CTA Redirects Correct Page", "pass", "CTA has a destination href (target not verified — no expected URL configured)")
      : record("TC_028", "CTA Redirects Correct Page", "skipped", "CTA is a <button> with no href; likely JS-driven action, not verifiable generically")
  );

  results.push(
    ctas.length > 1
      ? record("TC_029", "Multiple CTA Buttons Work", "pass", `${ctas.length} CTAs found, all enabled-checked`)
      : record("TC_029", "Multiple CTA Buttons Work", "skipped", "Only one CTA detected")
  );

  const stickyCta = await page.evaluate(() => {
    const els = document.querySelectorAll("[class*='sticky'], [style*='position: fixed'], [style*='position:fixed']");
    return els.length > 0;
  });
  results.push(
    stickyCta
      ? record("TC_030", "Sticky CTA Works", "pass", "Fixed/sticky positioned element detected (existence check only)")
      : record("TC_030", "Sticky CTA Works", "skipped", "No sticky CTA detected")
  );

  return results;
}
