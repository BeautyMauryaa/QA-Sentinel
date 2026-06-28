// Suite 12: Performance Basics
export const id = "performance";
export const label = "Performance Basics";

const LOAD_THRESHOLD_MS = 5000;

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const failedRequests = [];
  page.on("requestfailed", (req) => failedRequests.push(req.url()));
  const responses = [];
  page.on("response", (res) => responses.push(res));

  const start = Date.now();
  await page.goto(url, { waitUntil: "load", timeout: 30000 }).catch(() => {});
  const loadTime = Date.now() - start;

  results.push(
    loadTime <= LOAD_THRESHOLD_MS
      ? record("TC_071", "Homepage Load Time Under Threshold", "pass", `${loadTime}ms`)
      : record("TC_071", "Homepage Load Time Under Threshold", "fail", `${loadTime}ms exceeds ${LOAD_THRESHOLD_MS}ms threshold`)
  );

  const imgResponses = responses.filter((r) => /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(r.url()));
  const failedImgs = imgResponses.filter((r) => r.status() >= 400);
  results.push(
    imgResponses.length === 0
      ? record("TC_072", "Images Loaded Successfully", "skipped", "No image requests observed")
      : failedImgs.length === 0
      ? record("TC_072", "Images Loaded Successfully", "pass", `${imgResponses.length} image request(s)`)
      : record("TC_072", "Images Loaded Successfully", "fail", `${failedImgs.length} image request(s) failed`)
  );

  const jsResponses = responses.filter((r) => /\.js(\?|$)/i.test(r.url()));
  const failedJs = jsResponses.filter((r) => r.status() >= 400);
  results.push(
    jsResponses.length === 0
      ? record("TC_073", "JS Files Loaded", "skipped", "No JS requests observed")
      : failedJs.length === 0
      ? record("TC_073", "JS Files Loaded", "pass", `${jsResponses.length} script(s)`)
      : record("TC_073", "JS Files Loaded", "fail", `${failedJs.length} script(s) failed to load`)
  );

  const cssResponses = responses.filter((r) => /\.css(\?|$)/i.test(r.url()));
  const failedCss = cssResponses.filter((r) => r.status() >= 400);
  results.push(
    cssResponses.length === 0
      ? record("TC_074", "CSS Files Loaded", "skipped", "No CSS requests observed")
      : failedCss.length === 0
      ? record("TC_074", "CSS Files Loaded", "pass", `${cssResponses.length} stylesheet(s)`)
      : record("TC_074", "CSS Files Loaded", "fail", `${failedCss.length} stylesheet(s) failed to load`)
  );

  results.push(
    failedRequests.length === 0
      ? record("TC_075", "No Failed Network Requests", "pass")
      : record("TC_075", "No Failed Network Requests", "fail", `${failedRequests.length} failed: ${failedRequests.slice(0, 5).join(", ")}`)
  );

  return results;
}
