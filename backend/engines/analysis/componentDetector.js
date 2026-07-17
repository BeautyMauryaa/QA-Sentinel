export async function detectComponents(page) {

  console.log("\n========== Component Detection ==========\n");

  const components = await page.evaluate(() => {

    function detectType(el) {

    const tag = (el.tagName || "").toLowerCase();

    const cls =
        typeof el.className === "string"
            ? el.className.toLowerCase()
            : (el.getAttribute("class") || "").toLowerCase();

    const id =
        (el.id || "").toLowerCase();

    const text =
        (el.textContent || "").toLowerCase();

    // Navbar
    if (
        tag === "nav" ||
        cls.includes("navbar") ||
        cls.includes("nav")
    )
        return "Navbar";

    // Hero
    if (
        id.includes("hero") ||
        cls.includes("hero") ||
        cls.includes("banner") ||
        tag === "header"
    )
        return "Hero";

    // Footer
    if (tag === "footer")
        return "Footer";

    // Form
    if (tag === "form")
        return "Form";

    // CTA
    if (
        cls.includes("cta") ||
        text.includes("contact us") ||
        text.includes("book demo") ||
        text.includes("get started") ||
        text.includes("learn more")
    )
        return "CTA";

    // Pricing
    if (
        cls.includes("pricing") ||
        text.includes("pricing")
    )
        return "Pricing";

    // Carousel
    if (
        cls.includes("swiper") ||
        cls.includes("carousel") ||
        cls.includes("slick")
    )
        return "Carousel";

    return null;
}

    const all = [...document.body.querySelectorAll("*")];

    return all
      .map(el => {

        const component = detectType(el);

        if (!component)
          return null;

        const rect = el.getBoundingClientRect();

        return {

          component,

          selector:
            el.id
              ? "#" + el.id
              : el.tagName.toLowerCase(),

          x: rect.x,

          y: rect.y,

          width: rect.width,

          height: rect.height

        };

      })
      .filter(Boolean);

  });

  console.log(
    "Components Found:",
    components.length
  );

  return components;

}