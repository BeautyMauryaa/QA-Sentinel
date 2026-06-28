// Suite 9: Mobile Responsive Tests
export const id = "mobile";
export const label = "Mobile Responsive";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];
  const originalViewport = page.viewportSize();

  try {
    await page.setViewportSize({ width: 390, height: 844 }); // mobile
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const mobileBodyVisible = await page.evaluate(() => document.body.innerText.trim().length > 0);
    results.push(
      mobileBodyVisible
        ? record("TC_051", "Mobile Layout Loads", "pass")
        : record("TC_051", "Mobile Layout Loads", "fail", "Body has no visible content at mobile width", await screenshot(page, "TC_051"))
    );

    const hamburger = await page.$(
      "[class*='hamburger'], [class*='menu-toggle'], button[aria-label*='menu' i], [aria-label*='menu' i]"
    );
    results.push(
      hamburger
        ? record("TC_053", "Hamburger Menu Visible", "pass")
        : record("TC_053", "Hamburger Menu Visible", "fail", "No hamburger/menu-toggle control detected at mobile width")
    );

    if (hamburger) {
      try {
        await hamburger.click({ timeout: 5000 });
        await page.waitForTimeout(400);
        const navVisible = await page.evaluate(() => {
          const nav = document.querySelector("nav, [class*='mobile-nav'], [class*='menu']");
          if (!nav) return false;
          const style = window.getComputedStyle(nav);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        results.push(
          navVisible
            ? record("TC_054", "Hamburger Menu Opens", "pass")
            : record("TC_054", "Hamburger Menu Opens", "fail", "Menu did not become visible after clicking toggle", await screenshot(page, "TC_054"))
        );
        results.push(
          navVisible
            ? record("TC_055", "Mobile Navigation Works", "pass")
            : record("TC_055", "Mobile Navigation Works", "fail", "Mobile navigation not detected after opening menu")
        );
      } catch (err) {
        results.push(record("TC_054", "Hamburger Menu Opens", "fail", err.message));
        results.push(record("TC_055", "Mobile Navigation Works", "fail", "Could not verify — menu toggle failed"));
      }
    } else {
      results.push(record("TC_054", "Hamburger Menu Opens", "skipped", "No hamburger menu detected"));
      results.push(record("TC_055", "Mobile Navigation Works", "skipped", "No hamburger menu detected"));
    }

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    results.push(
      hasHorizontalScroll
        ? record("TC_056", "No Horizontal Scrolling", "fail", "document.scrollWidth exceeds viewport width at mobile size", await screenshot(page, "TC_056"))
        : record("TC_056", "No Horizontal Scrolling", "pass")
    );

    const overflowingElements = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return Array.from(document.querySelectorAll("body *")).filter(
        (el) => el.getBoundingClientRect().right > vw + 5
      ).length;
    });
    results.push(
      overflowingElements === 0
        ? record("TC_057", "Content Fits Screen", "pass")
        : record("TC_057", "Content Fits Screen", "fail", `${overflowingElements} element(s) overflow viewport width`)
    );

    // Tablet check
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const tabletBodyVisible = await page.evaluate(() => document.body.innerText.trim().length > 0);
    results.push(
      tabletBodyVisible
        ? record("TC_052", "Tablet Layout Loads", "pass")
        : record("TC_052", "Tablet Layout Loads", "fail", "Body has no visible content at tablet width")
    );
  } finally {
    if (originalViewport) await page.setViewportSize(originalViewport);
    await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  }

  return results;
}
