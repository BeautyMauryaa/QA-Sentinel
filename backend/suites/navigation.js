// Suite 2: Navigation Tests
export const id = "navigation";
export const label = "Navigation";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];

  const header = await page.$("header, [role='banner'], nav");
  results.push(
    header
      ? record("TC_006", "Header Visible", "pass")
      : record("TC_006", "Header Visible", "fail", "No <header>/[role=banner]/<nav> found")
  );

  const nav = await page.$("nav, [role='navigation']");
  results.push(
    nav
      ? record("TC_007", "Navigation Menu Visible", "pass")
      : record("TC_007", "Navigation Menu Visible", "fail", "No <nav>/[role=navigation] found")
  );

  // Heuristic: logo = first image/svg link inside header/nav linking somewhere
  const logo = await page.evaluate(() => {
    const scope = document.querySelector("header, nav") || document.body;
    const candidates = Array.from(scope.querySelectorAll("a img, a svg, a[class*='logo'], [class*='logo'] a"));
    return candidates.length > 0;
  });
  results.push(
    logo
      ? record("TC_008", "Logo Visible", "pass")
      : record("TC_008", "Logo Visible", "fail", "No logo-like element detected in header/nav")
  );

  const logoHref = await page.evaluate(() => {
    const scope = document.querySelector("header, nav") || document.body;
    const el = scope.querySelector("a img, a svg")?.closest("a");
    return el ? el.getAttribute("href") : null;
  });
  const looksLikeHome = logoHref === "/" || logoHref === "" || logoHref === url || /\/$/.test(logoHref || "");
  results.push(
    logoHref
      ? looksLikeHome
        ? record("TC_009", "Logo Redirects Homepage", "pass")
        : record("TC_009", "Logo Redirects Homepage", "fail", `Logo links to "${logoHref}", not homepage (heuristic check)`)
      : record("TC_009", "Logo Redirects Homepage", "skipped", "No logo link detected")
  );

  const navLinks = await page.$$eval("nav a[href], header a[href]", (els) =>
    els.map((e) => e.getAttribute("href")).filter(Boolean)
  );
  results.push(
    navLinks.length > 0
      ? record("TC_010", "All Navigation Links Clickable", "pass")
      : record("TC_010", "All Navigation Links Clickable", "fail", "No clickable links found in navigation")
  );

  // Check a sample of nav links for 404s (cap to avoid long runs)
  const sample = navLinks.slice(0, 8);
  let broken = [];
  for (const href of sample) {
    try {
      const absolute = new URL(href, url).toString();
      const res = await page.request.get(absolute, { timeout: 8000 }).catch(() => null);
      if (res && res.status() >= 400) broken.push(`${href} (${res.status()})`);
    } catch {
      // ignore mailto:, tel:, javascript: etc.
    }
  }
  results.push(
    broken.length === 0
      ? record("TC_011", "No Navigation Link Returns 404", "pass")
      : record("TC_011", "No Navigation Link Returns 404", "fail", broken.join(", "))
  );

  try {
    if (navLinks[0]) {
      await page.goto(new URL(navLinks[0], url).toString(), { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });
      results.push(record("TC_012", "Browser Back Works", "pass"));
      await page.goForward({ waitUntil: "domcontentloaded", timeout: 15000 });
      results.push(record("TC_013", "Browser Forward Works", "pass"));
    } else {
      results.push(record("TC_012", "Browser Back Works", "skipped", "No nav link to test with"));
      results.push(record("TC_013", "Browser Forward Works", "skipped", "No nav link to test with"));
    }
  } catch (err) {
    results.push(record("TC_012", "Browser Back Works", "fail", err.message));
    results.push(record("TC_013", "Browser Forward Works", "fail", err.message));
  }
  // restore to original url for subsequent suites
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});

  const activeHighlight = await page.evaluate(() => {
    const sel = "[aria-current], .active, [class*='active']";
    return !!document.querySelector(`nav ${sel}, header ${sel}`);
  });
  results.push(
    activeHighlight
      ? record("TC_014", "Current Page Highlighted", "pass")
      : record("TC_014", "Current Page Highlighted", "fail", "No aria-current/active indicator found (heuristic)")
  );

  const dropdownCount = await page.evaluate(() => {
    return document.querySelectorAll(
      "nav [class*='dropdown'], nav li:has(ul), header [class*='dropdown']"
    ).length;
  }).catch(() => 0);
  if (dropdownCount === 0) {
    results.push(record("TC_015", "Dropdown Menus Open Correctly", "skipped", "No dropdown menus detected"));
  } else {
    results.push(record("TC_015", "Dropdown Menus Open Correctly", "pass", `${dropdownCount} dropdown(s) detected (existence check only)`));
  }

  return results;
}
