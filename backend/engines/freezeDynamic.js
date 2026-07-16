export async function freezeDynamicElements(page, detected) {

  console.log("\nFreezing Dynamic Components...\n");

  for (const item of detected) {

    try {

      await page.locator(item.selector).evaluateAll((elements) => {

        elements.forEach((el) => {

          // Stop animations
          el.style.animation = "none";
          el.style.transition = "none";

          // Stop transforms
          el.style.transform = "none";

          // Pause videos
          if (el.tagName === "VIDEO") {

            el.pause();

          }

          // Hide blinking cursor etc.
          el.style.caretColor = "transparent";

        });

      });

      console.log("Frozen:", item.selector);

    } catch (err) {

      console.log("Couldn't freeze:", item.selector);

    }

  }

}