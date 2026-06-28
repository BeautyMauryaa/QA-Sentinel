// Suite 11: Accessibility Basics
export const id = "accessibility";
export const label = "Accessibility Basics";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const images = await page.$$("img");
  const missingAlt = [];
  for (const img of images.slice(0, 40)) {
    const alt = await img.getAttribute("alt");
    if (alt === null) {
      const src = await img.getAttribute("src").catch(() => "");
      missingAlt.push(src || "(no src)");
    }
  }
  results.push(
    images.length === 0
      ? record("TC_066", "Images Have Alt Text", "skipped", "No images found")
      : missingAlt.length === 0
      ? record("TC_066", "Images Have Alt Text", "pass", `${images.length} image(s) checked`)
      : record("TC_066", "Images Have Alt Text", "fail", `${missingAlt.length} missing alt: ${missingAlt.slice(0, 5).join(", ")}`)
  );

  const buttons = await page.$$("button, [role='button']");
  let unlabeled = 0;
  for (const btn of buttons.slice(0, 40)) {
    const accessible = await btn.evaluate((el) => {
      const text = el.innerText?.trim();
      const ariaLabel = el.getAttribute("aria-label");
      const ariaLabelledby = el.getAttribute("aria-labelledby");
      return !!(text || ariaLabel || ariaLabelledby);
    });
    if (!accessible) unlabeled++;
  }
  results.push(
    buttons.length === 0
      ? record("TC_067", "Buttons Have Labels", "skipped", "No buttons found")
      : unlabeled === 0
      ? record("TC_067", "Buttons Have Labels", "pass", `${buttons.length} button(s) checked`)
      : record("TC_067", "Buttons Have Labels", "fail", `${unlabeled} button(s) with no accessible label`)
  );

  const links = await page.$$("a[href]");
  let unnamedLinks = 0;
  for (const link of links.slice(0, 60)) {
    const accessible = await link.evaluate((el) => {
      const text = el.innerText?.trim();
      const ariaLabel = el.getAttribute("aria-label");
      const title = el.getAttribute("title");
      const hasImgAlt = !!el.querySelector("img[alt]:not([alt=''])");
      return !!(text || ariaLabel || title || hasImgAlt);
    });
    if (!accessible) unnamedLinks++;
  }
  results.push(
    links.length === 0
      ? record("TC_068", "Links Have Accessible Names", "skipped", "No links found")
      : unnamedLinks === 0
      ? record("TC_068", "Links Have Accessible Names", "pass", `${links.length} link(s) checked`)
      : record("TC_068", "Links Have Accessible Names", "fail", `${unnamedLinks} link(s) with no accessible name`)
  );

  let keyboardNavWorks = false;
  try {
    await page.keyboard.press("Tab");
    keyboardNavWorks = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && el !== document.body;
    });
  } catch {}
  results.push(
    keyboardNavWorks
      ? record("TC_069", "Keyboard Navigation Works", "pass")
      : record("TC_069", "Keyboard Navigation Works", "fail", "Tab key did not move focus away from <body>")
  );

  let focusVisible = false;
  try {
    focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    });
  } catch {}
  results.push(
    keyboardNavWorks
      ? focusVisible
        ? record("TC_070", "Focus States Visible", "pass")
        : record("TC_070", "Focus States Visible", "fail", "Focused element has no visible outline/box-shadow")
      : record("TC_070", "Focus States Visible", "skipped", "Could not establish keyboard focus")
  );

  return results;
}
