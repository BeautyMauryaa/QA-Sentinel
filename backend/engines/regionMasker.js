/**
 * Region Masker
 * ---------------------------
 * Masks dynamic/interactive regions before screenshot.
 * Instead of removing them, it paints them with a solid color.
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

      await locator.evaluateAll((elements) => {
        elements.forEach((el) => {
          // Save original styles
          el.setAttribute(
            "data-original-style",
            el.getAttribute("style") || ""
          );

          // Mask region
          Object.assign(el.style, {
            background: "#FFFFFF",
            backgroundImage: "none",
            color: "transparent",
            borderColor: "transparent",
            boxShadow: "none",
            textShadow: "none",
            opacity: "1",
            visibility: "visible",
            animation: "none",
            transition: "none",
            transform: "none",
            overflow: "hidden",
          });

          // Hide children
          el.querySelectorAll("*").forEach((child) => {
            Object.assign(child.style, {
              visibility: "hidden",
            });
          });
        });
      });

      maskedRegions.push({
        selector,
        count,
      });

      console.log(`🟡 Masked ${selector} (${count})`);
    } catch (err) {
      console.warn(`Could not mask ${selector}: ${err.message}`);
    }
  }

  return maskedRegions;
}