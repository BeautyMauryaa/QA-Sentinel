/**
 * sectionIdentifier.js
 * ------------------------------------------
 * Maps visual issue bounding boxes to the
 * nearest DOM section using Playwright.
 */

export async function identifySections(page, boxes = []) {

  //----------------------------------------
  // Collect all major sections
  //----------------------------------------

  const sections = await page.evaluate(() => {

    const candidates = [
      "section",
      "main > div",
      "[data-section]",
      "[id]",
      ".elementor-section",
      ".container",
      ".wrapper"
    ];

    const elements = [];

    candidates.forEach(selector => {

      document.querySelectorAll(selector).forEach(el => {

        const rect = el.getBoundingClientRect();

        if (
          rect.height < 120 ||
          rect.width < 300
        ) {
          return;
        }

        const text =
          el.getAttribute("data-section") ||
          el.getAttribute("id") ||
          el.getAttribute("aria-label") ||
          el.querySelector("h1,h2,h3,h4")?.innerText ||
          el.className ||
          "Unnamed Section";

        elements.push({

          name: text.trim(),

          selector:
            el.id
              ? "#" + el.id
              : el.className
                ? "." + el.className
                    .split(" ")
                    .join(".")
                : "section",

          top:
            rect.top + window.scrollY,

          bottom:
            rect.bottom + window.scrollY,

          left:
            rect.left,

          right:
            rect.right,

          width:
            rect.width,

          height:
            rect.height

        });

      });

    });

    return elements;

  });

  //----------------------------------------
  // Remove duplicates
  //----------------------------------------

  const uniqueSections = [];

  const seen = new Set();

  for (const section of sections) {

    const key =
      section.name +
      "-" +
      Math.round(section.top);

    if (seen.has(key)) continue;

    seen.add(key);

    uniqueSections.push(section);

  }

  //----------------------------------------
  // Attach section to every issue
  //----------------------------------------

  const results = boxes.map(box => {

    const centerY =
      box.y + box.height / 2;

    const centerX =
      box.x + box.width / 2;

    let matched = null;

    for (const section of uniqueSections) {

      if (

        centerY >= section.top &&
        centerY <= section.bottom

      ) {

        matched = section;

        break;

      }

    }

    if (!matched) {

      let nearest = null;

      let distance = Infinity;

      for (const section of uniqueSections) {

        const d = Math.abs(
          centerY - section.top
        );

        if (d < distance) {

          distance = d;

          nearest = section;

        }

      }

      matched = nearest;

    }

    return {

      ...box,

      section: matched
        ? {

            name: matched.name,

            selector: matched.selector,

            bounds: {

              top: matched.top,

              bottom: matched.bottom,

              width: matched.width,

              height: matched.height

            }

          }
        : {

            name: "Unknown",

            selector: "",

            bounds: {}

          }

    };

  });

  //----------------------------------------
  // Debug
  //----------------------------------------

  console.log("\n========== Sections ==========\n");

  uniqueSections.forEach(section => {

    console.log(
      section.name,
      `(${Math.round(section.top)}-${Math.round(section.bottom)})`
    );

  });

  console.log("\n==============================\n");

  return results;

}