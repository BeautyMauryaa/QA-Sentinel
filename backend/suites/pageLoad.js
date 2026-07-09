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
    response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (err) {
    results.push(
      record(
        "TC_001",
        "Homepage Loads",
        "fail",
        `Navigation failed: ${err.message}`
      )
    );

    for (const [id, name] of [
      ["TC_002", "No Console Errors"],
      ["TC_003", "Page Title Exists"],
      ["TC_004", "Favicon Exists"],
      ["TC_005", "Main Content Visible"],
    ]) {
      results.push(record(id, name, "skipped", "Page failed to load"));
    }

    return results;
  }

  await page.waitForTimeout(1000);

  const status = response?.status() ?? 0;
  const title = await page.title();
  const html = await page.content();

  // Helpful logs for Render debugging
  console.log("=================================");
  console.log("URL:", page.url());
  console.log("HTTP Status:", status);
  console.log("Page Title:", title);
  console.log("=================================");

  // ------------------------------------------
  // TC_001 Homepage Loads
  // ------------------------------------------

  if (status < 200 || status >= 300) {
    let errorMessage = `HTTP ${status}`;

    switch (status) {
      case 401:
        errorMessage =
          "Authentication Required (401 Unauthorized)";
        break;

      case 403:
        if (/cloudflare/i.test(html)) {
          errorMessage =
            "Blocked by Cloudflare Bot Protection (403)";
        } else if (/access denied/i.test(html)) {
          errorMessage =
            "Access Denied by Website (403)";
        } else {
          errorMessage =
            "403 Forbidden - Website blocked the automated browser or server IP.";
        }
        break;

      case 404:
        errorMessage = "404 Page Not Found";
        break;

      case 429:
        errorMessage =
          "429 Too Many Requests (Rate Limited)";
        break;

      case 500:
        errorMessage =
          "500 Internal Server Error";
        break;

      case 502:
        errorMessage =
          "502 Bad Gateway";
        break;

      case 503:
        errorMessage =
          "503 Service Unavailable";
        break;

      default:
        errorMessage = `HTTP Error ${status}`;
    }

    results.push(
      record(
        "TC_001",
        "Homepage Loads",
        "fail",
        errorMessage,
        await screenshot(page, "TC_001")
      )
    );

    for (const [id, name] of [
      ["TC_002", "No Console Errors"],
      ["TC_003", "Page Title Exists"],
      ["TC_004", "Favicon Exists"],
      ["TC_005", "Main Content Visible"],
    ]) {
      results.push(record(id, name, "skipped", errorMessage));
    }

    return results;
  }

  // Success
  results.push(record("TC_001", "Homepage Loads", "pass"));

  // ------------------------------------------
  // TC_002 No Console Errors
  // ------------------------------------------

  const criticalErrors = consoleErrors.filter(
    (e) =>
      !/favicon|chrome-extension|ResizeObserver|font|image/i.test(e)
  );

  results.push(
    criticalErrors.length
      ? record(
          "TC_002",
          "No Console Errors",
          "fail",
          criticalErrors.slice(0, 3).join(" | ")
        )
      : record("TC_002", "No Console Errors", "pass")
  );

  // ------------------------------------------
  // TC_003 Page Title Exists
  // ------------------------------------------

  results.push(
    title.trim()
      ? record("TC_003", "Page Title Exists", "pass")
      : record(
          "TC_003",
          "Page Title Exists",
          "fail",
          "Document has no title"
        )
  );

  // ------------------------------------------
  // TC_004 Favicon Exists
  // ------------------------------------------

  const hasFavicon = await page.evaluate(() =>
    !!document.querySelector("link[rel*='icon']")
  );

  results.push(
    hasFavicon
      ? record("TC_004", "Favicon Exists", "pass")
      : record(
          "TC_004",
          "Favicon Exists",
          "fail",
          "No favicon found"
        )
  );

  // ------------------------------------------
  // TC_005 Main Content Visible
  // ------------------------------------------

  const bodyVisible = await page.evaluate(() => {
    return (
      document.body &&
      document.body.innerText.trim().length > 0
    );
  });

  results.push(
    bodyVisible
      ? record("TC_005", "Main Content Visible", "pass")
      : record(
          "TC_005",
          "Main Content Visible",
          "fail",
          "No visible content found",
          await screenshot(page, "TC_005")
        )
  );

  return results;
}