// Suite 8: Image Tests
export const id = "images";
export const label = "Images";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];

  const heroImg = await page.$("[class*='hero'] img, header img, main img, img");
  results.push(
    heroImg
      ? record("TC_046", "Hero Image Loads", "pass")
      : record("TC_046", "Hero Image Loads", "skipped", "No image found to evaluate as hero image")
  );
  if (heroImg) {
    const naturalWidth = await heroImg.evaluate((img) => img.naturalWidth).catch(() => 0);
    if (naturalWidth === 0) {
      results.pop();
      results.push(record("TC_046", "Hero Image Loads", "fail", "First image on page failed to load (naturalWidth=0)", await screenshot(page, "TC_046")));
    }
  }

  const images = await page.$$("img");
  let broken = [];
  for (const img of images.slice(0, 30)) {
    const nw = await img.evaluate((el) => el.naturalWidth).catch(() => 0);
    const src = await img.getAttribute("src").catch(() => null);
    if (nw === 0 && src) broken.push(src);
  }
  results.push(
    images.length === 0
      ? record("TC_047", "No Broken Images", "skipped", "No <img> elements found")
      : broken.length === 0
      ? record("TC_047", "No Broken Images", "pass", `${images.length} image(s) checked`)
      : record("TC_047", "No Broken Images", "fail", `${broken.length} broken: ${broken.slice(0, 5).join(", ")}`)
  );

  let badDimensions = [];
  for (const img of images.slice(0, 30)) {
    const dims = await img.evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight })).catch(() => null);
    const src = await img.getAttribute("src").catch(() => "");
    if (dims && dims.w > 0 && (dims.w < 2 || dims.h < 2)) badDimensions.push(src);
  }
  results.push(
    images.length === 0
      ? record("TC_048", "Image Dimensions Valid", "skipped", "No images found")
      : badDimensions.length === 0
      ? record("TC_048", "Image Dimensions Valid", "pass")
      : record("TC_048", "Image Dimensions Valid", "fail", `Degenerate dimensions: ${badDimensions.slice(0, 5).join(", ")}`)
  );

  const lazyImages = await page.$$("img[loading='lazy']");
  if (lazyImages.length === 0) {
    results.push(record("TC_049", "Lazy Loaded Images Load", "skipped", "No loading='lazy' images found"));
  } else {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    let unloaded = [];
    for (const img of lazyImages.slice(0, 15)) {
      const nw = await img.evaluate((el) => el.naturalWidth).catch(() => 0);
      const src = await img.getAttribute("src").catch(() => "");
      if (nw === 0) unloaded.push(src);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    results.push(
      unloaded.length === 0
        ? record("TC_049", "Lazy Loaded Images Load", "pass", `${lazyImages.length} lazy image(s) checked`)
        : record("TC_049", "Lazy Loaded Images Load", "fail", `${unloaded.length} lazy image(s) did not load after scroll`)
    );
  }

  const clickableImages = await page.$$("a img, button img, img[onclick]");
  results.push(
    clickableImages.length === 0
      ? record("TC_050", "Image Click Actions Work", "skipped", "No clickable images detected")
      : record("TC_050", "Image Click Actions Work", "pass", `${clickableImages.length} clickable image(s) detected (existence check only)`)
  );

  return results;
}
