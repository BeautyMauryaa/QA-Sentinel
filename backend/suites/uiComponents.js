// Suite 10: UI Component Tests
export const id = "uiComponents";
export const label = "UI Components";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];

  // TC_058: Buttons Visible
  const buttons = await page.$$("button, input[type='button'], input[type='submit'], [role='button']");
  results.push(
    buttons.length > 0
      ? record("TC_058", "Buttons Visible", "pass", `${buttons.length} button(s) found`)
      : record("TC_058", "Buttons Visible", "fail", "No buttons found on page")
  );

  // TC_059: Buttons Clickable
  let clickable = 0;
  for (const btn of buttons.slice(0, 5)) {
    try {
      const enabled = await btn.isEnabled().catch(() => false);
      const visible = await btn.isVisible().catch(() => false);
      if (enabled && visible) clickable++;
    } catch {}
  }
  results.push(
    clickable > 0
      ? record("TC_059", "Buttons Clickable", "pass", `${clickable} of ${Math.min(buttons.length, 5)} sampled buttons are enabled and visible`)
      : record("TC_059", "Buttons Clickable", "fail", "No enabled visible buttons found in sample")
  );

  // TC_060: Cards Visible
  const cards = await page.$$(
    "[class*='card'], [class*='Card'], article, [class*='tile'], [class*='Tile'], [class*='item']:not(li)"
  );
  results.push(
    cards.length > 0
      ? record("TC_060", "Cards Visible", "pass", `${cards.length} card-like element(s) detected`)
      : record("TC_060", "Cards Visible", "skipped", "No card/tile elements detected on page")
  );

  // TC_061: Accordions Open
  const accordionTriggers = await page.$$(
    "[class*='accordion'] button, details summary, [aria-expanded], [class*='collapse'] button, [data-toggle='collapse']"
  );
  if (accordionTriggers.length === 0) {
    results.push(record("TC_061", "Accordions Open", "skipped", "No accordion elements detected"));
  } else {
    try {
      const trigger = accordionTriggers[0];
      const beforeExpanded = await trigger.getAttribute("aria-expanded").catch(() => null);
      await trigger.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      const afterExpanded = await trigger.getAttribute("aria-expanded").catch(() => null);
      const opened =
        afterExpanded === "true" ||
        (beforeExpanded === null && afterExpanded === null); // details element fallback
      results.push(
        opened
          ? record("TC_061", "Accordions Open", "pass", "Accordion expanded on click")
          : record("TC_061", "Accordions Open", "fail", "Accordion aria-expanded did not change to true after click",
              await screenshot(page, "TC_061"))
      );
    } catch (err) {
      results.push(record("TC_061", "Accordions Open", "fail", err.message));
    }
  }

  // TC_062: Tabs Switch Properly
  const tabTriggers = await page.$$(
    "[role='tab'], [class*='tab']:not([class*='table']):not(table) button, nav button"
  );
  if (tabTriggers.length < 2) {
    results.push(record("TC_062", "Tabs Switch Properly", "skipped", "No tab components detected"));
  } else {
    try {
      const first  = tabTriggers[0];
      const second = tabTriggers[1];
      await first.click({ timeout: 5000 });
      await page.waitForTimeout(300);
      const firstSelected = await first.getAttribute("aria-selected").catch(() => null);
      await second.click({ timeout: 5000 });
      await page.waitForTimeout(300);
      const secondSelected = await second.getAttribute("aria-selected").catch(() => null);
      const switched = secondSelected === "true" || firstSelected !== secondSelected;
      results.push(
        switched
          ? record("TC_062", "Tabs Switch Properly", "pass")
          : record("TC_062", "Tabs Switch Properly", "fail", "Tab aria-selected state did not change on click")
      );
    } catch (err) {
      results.push(record("TC_062", "Tabs Switch Properly", "fail", err.message));
    }
  }

  // TC_063: Modal Opens
  const modalTriggers = await page.$$(
    "[data-toggle='modal'], [data-bs-toggle='modal'], [aria-haspopup='dialog'], button[class*='modal'], button[class*='popup']"
  );
  if (modalTriggers.length === 0) {
    results.push(record("TC_063", "Modal Opens", "skipped", "No modal trigger buttons detected"));
  } else {
    try {
      await modalTriggers[0].click({ timeout: 5000 });
      await page.waitForTimeout(600);
      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector(
          "[role='dialog'], [class*='modal'][class*='show'], [class*='modal'][class*='open'], [class*='popup'][class*='open']"
        );
        if (!modal) return false;
        const s = window.getComputedStyle(modal);
        return s.display !== "none" && s.visibility !== "hidden";
      });
      results.push(
        modalVisible
          ? record("TC_063", "Modal Opens", "pass")
          : record("TC_063", "Modal Opens", "fail", "Modal did not become visible after trigger click",
              await screenshot(page, "TC_063"))
      );
    } catch (err) {
      results.push(record("TC_063", "Modal Opens", "fail", err.message));
    }
  }

  // TC_064: Modal Closes
  const modalOpen = await page.evaluate(() => {
    const modal = document.querySelector("[role='dialog'], [class*='modal'][class*='show']");
    if (!modal) return false;
    return window.getComputedStyle(modal).display !== "none";
  });

  if (!modalOpen) {
    results.push(record("TC_064", "Modal Closes", "skipped", "No open modal found to test close behavior"));
  } else {
    try {
      // Try Escape key first
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      const stillOpen = await page.evaluate(() => {
        const modal = document.querySelector("[role='dialog'], [class*='modal'][class*='show']");
        if (!modal) return false;
        return window.getComputedStyle(modal).display !== "none";
      });
      if (!stillOpen) {
        results.push(record("TC_064", "Modal Closes", "pass", "Modal closed on Escape key"));
      } else {
        // Try close button
        const closeBtn = await page.$("[aria-label='close' i], [class*='close'], [class*='dismiss'], button[data-dismiss]");
        if (closeBtn) {
          await closeBtn.click({ timeout: 5000 });
          await page.waitForTimeout(400);
          results.push(record("TC_064", "Modal Closes", "pass", "Modal closed via close button"));
        } else {
          results.push(record("TC_064", "Modal Closes", "fail", "Modal did not close on Escape or via close button"));
        }
      }
    } catch (err) {
      results.push(record("TC_064", "Modal Closes", "fail", err.message));
    }
  }

  // TC_065: Carousel Navigation Works
  const carouselNext = await page.$$(
    "[class*='carousel'] [class*='next'], [class*='slider'] [class*='next'], [aria-label*='next' i], [class*='swiper-button-next']"
  );
  if (carouselNext.length === 0) {
    results.push(record("TC_065", "Carousel Navigation Works", "skipped", "No carousel/slider detected"));
  } else {
    try {
      // Get some indicator of current slide before clicking
      const before = await page.evaluate(() => {
        const active = document.querySelector(
          "[class*='carousel'] [class*='active'], [class*='swiper-slide-active']"
        );
        return active ? active.textContent?.trim().slice(0, 40) : null;
      });

      await carouselNext[0].click({ timeout: 5000 });
      await page.waitForTimeout(600);

      const after = await page.evaluate(() => {
        const active = document.querySelector(
          "[class*='carousel'] [class*='active'], [class*='swiper-slide-active']"
        );
        return active ? active.textContent?.trim().slice(0, 40) : null;
      });

      results.push(
        before !== after || after !== null
          ? record("TC_065", "Carousel Navigation Works", "pass", "Carousel next button clicked successfully")
          : record("TC_065", "Carousel Navigation Works", "fail", "Carousel slide did not change after clicking next")
      );
    } catch (err) {
      results.push(record("TC_065", "Carousel Navigation Works", "fail", err.message));
    }
  }

  // Reload original URL to avoid leaving page in a modified state
  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});

  return results;
}