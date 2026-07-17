export async function analyzeLayout(page) {

  console.log("\n========== Layout Analyzer ==========\n");

  const sections = await page.evaluate(() => {

    function getSelector(el) {

      if (el.id)
        return "#" + el.id;

      if (el.className && typeof el.className === "string") {
        const cls = el.className
          .trim()
          .split(/\s+/)
          .slice(0,2)
          .join(".");

        if (cls)
          return "." + cls;
      }

      return el.tagName.toLowerCase();
    }

    const elements = [...document.body.querySelectorAll(
      "header,nav,main,section,article,aside,footer"
    )];

    return elements.map(el => {

      const rect = el.getBoundingClientRect();

      return {

        selector: getSelector(el),

        tag: el.tagName,

        x: Math.round(rect.x),

        y: Math.round(rect.y),

        width: Math.round(rect.width),

        height: Math.round(rect.height),

        visible:
          rect.width > 0 &&
          rect.height > 0

      };

    });

  });

  console.log(
    "Detected Sections:",
    sections.length
  );

  return sections;

}