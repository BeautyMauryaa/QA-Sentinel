// Suite 3: Footer Tests (Updated)
export const id = "footer";
export const label = "Footer";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  // Updated: Include common footer class names and IDs
  const footerSelector = "footer, [role='contentinfo'], .footer, .site-footer, [class*='footer'], #footer";
  const footer = await page.$(footerSelector);
  
  results.push(
    footer
      ? record("TC_016", "Footer Visible", "pass")
      : record("TC_016", "Footer Visible", "fail", "No <footer> / .footer container found")
  );

  if (!footer) {
    for (const [tid, name] of [
      ["TC_017", "Footer Links Clickable"],
      ["TC_018", "Footer Links Return 200"],
      ["TC_019", "Copyright Text Visible"],
      ["TC_020", "Contact Information Visible"],
    ]) {
      results.push(record(tid, name, "skipped", "No footer container identified"));
    }
    return results;
  }

  // Updated: Search for links using the broad selector
  const footerLinks = await page.$$eval(`${footerSelector} a[href]`, (els) =>
    els.map((e) => e.getAttribute("href")).filter(Boolean)
  );
  
  results.push(
    footerLinks.length > 0
      ? record("TC_017", "Footer Links Clickable", "pass")
      : record("TC_017", "Footer Links Clickable", "fail", "No links found in footer")
  );

  // Broken Link Check
  let broken = [];
  for (const href of footerLinks.slice(0, 10)) {
    try {
      const absolute = new URL(href, url).toString();
      const res = await page.request.get(absolute, { timeout: 8000 }).catch(() => null);
      if (res && res.status() >= 400) broken.push(`${href} (${res.status()})`);
    } catch {}
  }
  results.push(
    footerLinks.length === 0
      ? record("TC_018", "Footer Links Return 200", "skipped", "No footer links")
      : broken.length === 0
      ? record("TC_018", "Footer Links Return 200", "pass")
      : record("TC_018", "Footer Links Return 200", "fail", broken.join(", "))
  );

  // Updated: Use the 'footer' variable as the scope for text checks
  const footerText = await page.evaluate((el) => el.innerText || "", footer);
  
  const hasCopyright = /©|copyright|\ball rights reserved\b/i.test(footerText);
  results.push(
    hasCopyright
      ? record("TC_019", "Copyright Text Visible", "pass")
      : record("TC_019", "Copyright Text Visible", "fail", "No © / copyright text detected")
  );

  const hasContact = /@|tel:|contact|address|phone/i.test(footerText) ||
    (await footer.$("a[href^='mailto:'], a[href^='tel:']")) !== null;
  results.push(
    hasContact
      ? record("TC_020", "Contact Information Visible", "pass")
      : record("TC_020", "Contact Information Visible", "fail", "No contact info detected")
  );

  return results;
}