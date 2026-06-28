// Suite 3: Footer Tests
export const id = "footer";
export const label = "Footer";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const footer = await page.$("footer, [role='contentinfo']");
  results.push(
    footer
      ? record("TC_016", "Footer Visible", "pass")
      : record("TC_016", "Footer Visible", "fail", "No <footer>/[role=contentinfo] found")
  );

  if (!footer) {
    for (const [tid, name] of [
      ["TC_017", "Footer Links Clickable"],
      ["TC_018", "Footer Links Return 200"],
      ["TC_019", "Copyright Text Visible"],
      ["TC_020", "Contact Information Visible"],
    ]) {
      results.push(record(tid, name, "skipped", "No footer present"));
    }
    return results;
  }

  const footerLinks = await page.$$eval("footer a[href]", (els) =>
    els.map((e) => e.getAttribute("href")).filter(Boolean)
  );
  results.push(
    footerLinks.length > 0
      ? record("TC_017", "Footer Links Clickable", "pass")
      : record("TC_017", "Footer Links Clickable", "fail", "No links found in footer")
  );

  let broken = [];
  for (const href of footerLinks.slice(0, 10)) {
    try {
      const absolute = new URL(href, url).toString();
      const res = await page.request.get(absolute, { timeout: 8000 }).catch(() => null);
      if (res && res.status() >= 400) broken.push(`${href} (${res.status()})`);
    } catch {
      // skip non-http schemes
    }
  }
  results.push(
    footerLinks.length === 0
      ? record("TC_018", "Footer Links Return 200", "skipped", "No footer links to check")
      : broken.length === 0
      ? record("TC_018", "Footer Links Return 200", "pass")
      : record("TC_018", "Footer Links Return 200", "fail", broken.join(", "))
  );

  const footerText = await page.$eval("footer", (el) => el.innerText || "");
  const hasCopyright = /©|copyright|\ball rights reserved\b/i.test(footerText);
  results.push(
    hasCopyright
      ? record("TC_019", "Copyright Text Visible", "pass")
      : record("TC_019", "Copyright Text Visible", "fail", "No © / copyright / rights reserved text in footer")
  );

  const hasContact = /@|tel:|contact|address|phone/i.test(footerText) ||
    (await page.$("footer a[href^='mailto:'], footer a[href^='tel:']")) !== null;
  results.push(
    hasContact
      ? record("TC_020", "Contact Information Visible", "pass")
      : record("TC_020", "Contact Information Visible", "fail", "No email/phone/contact text detected in footer")
  );

  return results;
}
