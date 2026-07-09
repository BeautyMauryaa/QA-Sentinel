// Suite 1: Page Load Tests

export const id = "pageLoad";
export const label = "Page Load";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  let response;
  try {
    response = await page.goto(url, {   // ← single goto, capture response
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (err) {
    results.push(record("TC_001", "Homepage Loads", "fail", err.message));
    for (const [tid, name] of [
      ["TC_002", "No Console Errors"],
      ["TC_003", "Page Title Exists"],
      ["TC_004", "Favicon Exists"],
      ["TC_005", "Main Content Visible"],
    ]) {
      results.push(record(tid, name, "skipped", "Page failed to load"));
    }
    return results;
  }

  await page.waitForTimeout(1000);

  // --------------------------------------------------
  // TC_001 Homepage Loads
  // --------------------------------------------------

  // const status = response?.status() ?? 0;  // ← derive status from captured response

  // if (status === 401) {
  //   results.push(
  //     record(
  //       "TC_000",
  //       "Authentication Required",
  //       "fail",
  //       "Website requires credentials",
  //       await screenshot(page, "TC_000")
  //     )
  //   );
  //   return results;
  // }

  // results.push(record("TC_001", "Homepage Loads", "pass")); // ← TC_001 pass recorded


  // --------------------------------------------------
  // TC_001 Homepage Loads
  // --------------------------------------------------
  const status = response?.status() ?? 0;

  // Catch all non-successful status codes (anything outside 200-299)
  if (status < 200 || status >= 300) {
    let errorMessage = `HTTP Error: ${status}`;
    
    // Specifically identify auth issues for better reporting
    if (status === 401 || status === 403) {
      errorMessage = "Authentication Required: Website requires credentials";
    }

    results.push(
      record(
        "TC_001",
        "Homepage Loads",
        "fail",
        errorMessage,
        await screenshot(page, "TC_001") // Capture error screenshot
      )
    );
    return results; // Stop further testing as the page didn't load
  }

  // If we reach here, the status is 2xx, it's a genuine pass
  results.push(record("TC_001", "Homepage Loads", "pass"));

  
  // --------------------------------------------------
  // TC_002 No Console Errors
  // --------------------------------------------------

  const criticalErrors = consoleErrors.filter(
    (e) => !/favicon|chrome-extension|ResizeObserver|font|image/i.test(e)
  );

  results.push(
    criticalErrors.length > 0
      ? record("TC_002", "No Console Errors", "fail", criticalErrors.slice(0, 3).join(" | "))
      : record("TC_002", "No Console Errors", "pass")
  );

  // --------------------------------------------------
  // TC_003 Page Title Exists
  // --------------------------------------------------

  const title = await page.title();
  results.push(
    title?.trim()
      ? record("TC_003", "Page Title Exists", "pass")
      : record("TC_003", "Page Title Exists", "fail", "Document has no title")
  );

  // --------------------------------------------------
  // TC_004 Favicon Exists
  // --------------------------------------------------

  const hasFavicon = await page.evaluate(() => {
    return !!document.querySelector("link[rel*='icon']");
  });
  results.push(
    hasFavicon
      ? record("TC_004", "Favicon Exists", "pass")
      : record("TC_004", "Favicon Exists", "fail", "No favicon found")
  );

  // --------------------------------------------------
  // TC_005 Main Content Visible
  // --------------------------------------------------

  const bodyVisible = await page.evaluate(() => {
    return document.body && document.body.innerText.trim().length > 0;
  });
  results.push(
    bodyVisible
      ? record("TC_005", "Main Content Visible", "pass")
      : record("TC_005", "Main Content Visible", "fail", "No visible content found", await screenshot(page, "TC_005"))
  );

  return results;
}