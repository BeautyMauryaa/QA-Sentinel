/**
 * Region Masker
 * ------------------------------------
 * Masks dynamic/interactive regions before screenshot.
 * Instead of removing them, it paints them with a solid color
 * and records their bounding boxes for the comparator.
 */

export async function maskRegions(page, selectors = []) {
  if (!selectors || selectors.length === 0) {
    return [];
  }

  const maskedRegions = [];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      const count = await locator.count();

      if (count === 0) continue;

      // Apply mask to all matched elements
      await locator.evaluateAll((elements) => {
        elements.forEach((el) => {
          // Save original style (optional, useful for future restore)
          el.setAttribute(
            "data-original-style",
            el.getAttribute("style") || ""
          );

          // Strong mask using !important
          el.style.cssText += `
            background:#808080 !important;
            background-image:none !important;
            color:transparent !important;
            border:none !important;
            border-color:transparent !important;
            box-shadow:none !important;
            text-shadow:none !important;
            outline:none !important;
            animation:none !important;
            transition:none !important;
            transform:none !important;
            overflow:hidden !important;
            opacity:1 !important;
            visibility:visible !important;
          `;

          // Hide every child completely
          el.querySelectorAll("*").forEach((child) => {
            child.style.display = "none";
          });
        });
      });

      // Save bounding box for every matched element
      for (let i = 0; i < count; i++) {
        const element = locator.nth(i);
        const box = await element.boundingBox();

        if (!box) continue;

        maskedRegions.push({
          selector,
          index: i,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        });
      }

      console.log(`🟡 Masked ${selector} (${count})`);
    } catch (err) {
      console.warn(`⚠️ Could not mask "${selector}": ${err.message}`);
    }
  }

  console.log("\n========== Masked Regions ==========");
  console.table(maskedRegions);

  return maskedRegions;
}