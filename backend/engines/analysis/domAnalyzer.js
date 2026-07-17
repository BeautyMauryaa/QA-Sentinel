import { loadVisualRules } from "../dynamic/visualRulesLoader.js";

const DYNAMIC_SELECTORS = [
  // Sliders & Carousels
  ".swiper",
  ".swiper-wrapper",
  ".swiper-slide",
  ".slick-slider",
  ".slick-track",
  ".slick-list",
  ".splide",
  ".splide__track",
  ".owl-carousel",
  ".owl-stage",

  // Elementor
  ".elementor-motion-effects-layer",
  ".elementor-background-video-container",
  ".elementor-slides",
  ".elementor-image-carousel-wrapper",
  ".elementor-widget-image-carousel",

  // Marquee
  ".marquee",
  ".ticker",

  // Media
  "video",
  "canvas",
  "iframe",

  // Lottie
  "lottie-player",

  // Generic
  "[data-swiper]",
  "[data-carousel]"
];

export async function analyzeDOM(page) {
  console.log("\n========== DOM Analysis ==========\n");

  const rules = await loadVisualRules();

  const sections = [];

  const summary = {
    static: 0,
    carousel: 0,
    scrollable: 0,
    layoutOnly: 0,
    video: 0,
    iframe: 0,
    canvas: 0
  };

  // -----------------------------
  // Dynamic selector detection
  // -----------------------------

  for (const selector of DYNAMIC_SELECTORS) {
    const locator = page.locator(selector);
    const count = await locator.count();

    if (!count) continue;

    let type = "DYNAMIC";
    let strategy = "IGNORE";

    if (selector === "video") {
      type = "VIDEO";
      strategy = "FREEZE";
      summary.video++;
    } else if (selector === "iframe") {
      type = "IFRAME";
      strategy = "FREEZE";
      summary.iframe++;
    } else if (selector === "canvas") {
      type = "CANVAS";
      strategy = "FREEZE";
      summary.canvas++;
    } else {
      type = "CAROUSEL";
      strategy = "IGNORE";
      summary.carousel++;
    }

    console.log(`✓ ${selector} (${count})`);

    sections.push({
      selector,
      count,
      type,
      strategy
    });
  }

  // -----------------------------
  // Layout-only sections
  // -----------------------------

  for (const selector of rules.layoutOnly || []) {
    const count = await page.locator(selector).count();

    if (!count) continue;

    summary.layoutOnly++;

    console.log(`✓ Layout : ${selector}`);

    sections.push({
      selector,
      count,
      type: "LAYOUT_ONLY",
      strategy: "LAYOUT"
    });
  }

  // -----------------------------
  // Scrollable containers
  // -----------------------------

  const scrollables = await page.evaluate(() => {
    const result = [];

    document.querySelectorAll("*").forEach((el) => {
      const horizontal = el.scrollWidth > el.clientWidth;
      const vertical = el.scrollHeight > el.clientHeight;

      if (!horizontal && !vertical) return;

      const style = getComputedStyle(el);

      const overflow =
        style.overflow !== "visible" ||
        style.overflowX !== "visible" ||
        style.overflowY !== "visible";

      if (!overflow) return;

      result.push({
        tag: el.tagName.toLowerCase(),
        className: el.className,
        horizontal,
        vertical
      });
    });

    return result;
  });

  for (const item of scrollables) {
    summary.scrollable++;

    sections.push({
      selector:
        item.className?.length > 0
          ? `.${item.className.split(" ").join(".")}`
          : item.tag,
      count: 1,
      type: "SCROLLABLE",
      strategy: "IGNORE_OVERFLOW",
      horizontal: item.horizontal,
      vertical: item.vertical
    });
  }

  console.log("\n----------- Summary -----------");

  console.table(summary);

  console.log("--------------------------------");

  return {
    sections,
    summary
  };
}