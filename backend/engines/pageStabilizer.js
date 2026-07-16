export async function stabilizePage(page, ignoreSelectors = []) {
  console.log("Waiting for page load...");

  await page.waitForLoadState("load");

  await page.waitForLoadState("networkidle");

  // Wait for fonts
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });

  // Trigger lazy loading
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = 500;

      const timer = setInterval(() => {
        window.scrollTo(0, y);

        y += step;

        if (y >= document.body.scrollHeight) {
          clearInterval(timer);

          window.scrollTo(0, 0);

          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(3000);

  // Hide dynamic elements
  for (const selector of ignoreSelectors) {
    try {
      await page.locator(selector).evaluateAll((elements) => {
        elements.forEach((el) => {
          el.style.visibility = "hidden";
        });
      });
    } catch {
      console.log("Ignore selector not found:", selector);
    }
  }

  console.log("Page stabilized.");
}