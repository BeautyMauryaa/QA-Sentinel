// Suite 16: Error Page Tests
export const id = "errorPage";
export const label = "Error Page";

export async function run(page, url, helpers) {
  const { record, screenshot } = helpers;
  const results = [];
  const garbagePath = `/qa-sentinel-404-check-${Date.now()}`;
  const target = new URL(garbagePath, url).toString();

  let response;
  try {
    response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (err) {
    for (const [tid, name] of [
      ["TC_091", "Invalid URL Shows 404 Page"],
      ["TC_092", "404 Page Loads Correctly"],
      ["TC_093", "404 Has Homepage Link"],
      ["TC_094", "Error Page Styling Correct"],
    ]) {
      results.push(record(tid, name, "fail", err.message));
    }
    return results;
  }

  const status = response ? response.status() : 0;
  results.push(
    status === 404
      ? record("TC_091", "Invalid URL Shows 404 Page", "pass")
      : record("TC_091", "Invalid URL Shows 404 Page", "fail", `Expected HTTP 404, got ${status}`)
  );

  const bodyVisible = await page.evaluate(() => document.body.innerText.trim().length > 0);
  results.push(
    bodyVisible
      ? record("TC_092", "404 Page Loads Correctly", "pass")
      : record("TC_092", "404 Page Loads Correctly", "fail", "404 page rendered no visible content", await screenshot(page, "TC_092"))
  );

  const homeLink = await page.evaluate(() => {
    return !!Array.from(document.querySelectorAll("a[href]")).find((a) => {
      const href = a.getAttribute("href");
      return href === "/" || /home/i.test(a.textContent || "");
    });
  });
  results.push(
    homeLink
      ? record("TC_093", "404 Has Homepage Link", "pass")
      : record("TC_093", "404 Has Homepage Link", "fail", "No link back to homepage found on 404 page")
  );

  const hasStyling = await page.evaluate(() => {
    const linked = document.querySelectorAll("link[rel='stylesheet']").length > 0;
    const inline = document.querySelectorAll("style").length > 0;
    return linked || inline;
  });
  results.push(
    hasStyling
      ? record("TC_094", "Error Page Styling Correct", "pass", "Stylesheet detected on error page (visual correctness not verifiable generically)")
      : record("TC_094", "Error Page Styling Correct", "fail", "No stylesheet detected — error page may be unstyled browser default", await screenshot(page, "TC_094"))
  );

  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
  return results;
}
