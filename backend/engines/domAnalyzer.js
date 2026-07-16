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

  const detected = [];

  for (const selector of DYNAMIC_SELECTORS) {
    const count = await page.locator(selector).count();

    if (count > 0) {
      console.log(`✓ ${selector} (${count})`);

      detected.push({
        selector,
        count
      });
    }
  }

  console.log("\n==================================\n");

  return detected;
}