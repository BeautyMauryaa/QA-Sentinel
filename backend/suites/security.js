// Suite 13: Security Smoke Tests
export const id = "security";
export const label = "Security Smoke";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const isHttps = url.startsWith("https://");
  results.push(
    isHttps
      ? record("TC_076", "HTTPS Enabled", "pass")
      : record("TC_076", "HTTPS Enabled", "fail", "Site is served over plain HTTP")
  );

  const mixedContentRequests = [];
  page.on("requestfinished", (req) => {
    if (isHttps && req.url().startsWith("http://")) mixedContentRequests.push(req.url());
  });
  await page.reload({ waitUntil: "load", timeout: 20000 }).catch(() => {});
  results.push(
    !isHttps
      ? record("TC_077", "No Mixed Content", "skipped", "Site is not served over HTTPS")
      : mixedContentRequests.length === 0
      ? record("TC_077", "No Mixed Content", "pass")
      : record("TC_077", "No Mixed Content", "fail", `${mixedContentRequests.length} insecure resource(s) loaded over HTTP`)
  );

  const cookies = await page.context().cookies();
  const insecureCookies = cookies.filter((c) => !c.secure && isHttps);
  results.push(
    cookies.length === 0
      ? record("TC_078", "Secure Cookies Present", "skipped", "No cookies set")
      : insecureCookies.length === 0
      ? record("TC_078", "Secure Cookies Present", "pass", `${cookies.length} cookie(s) checked`)
      : record("TC_078", "Secure Cookies Present", "fail", `${insecureCookies.length} cookie(s) missing Secure flag`)
  );

  const pageText = await page.evaluate(() => document.documentElement.innerHTML);
  const sensitivePatterns = [
    /api[_-]?key\s*[:=]\s*["'][a-z0-9_\-]{10,}["']/i,
    /secret\s*[:=]\s*["'][a-z0-9_\-]{10,}["']/i,
    /password\s*[:=]\s*["'][^"']{4,}["']/i,
  ];
  const exposed = sensitivePatterns.some((p) => p.test(pageText));
  results.push(
    exposed
      ? record("TC_079", "Sensitive Data Not Exposed", "fail", "Pattern resembling an exposed API key/secret/password found in page source")
      : record("TC_079", "Sensitive Data Not Exposed", "pass")
  );

  const debugPaths = ["/debug", "/.env", "/phpinfo.php", "/wp-config.php.bak"];
  let openDebug = [];
  for (const p of debugPaths) {
    try {
      const abs = new URL(p, url).toString();
      const res = await page.request.get(abs, { timeout: 6000 }).catch(() => null);
      if (res && res.status() === 200) openDebug.push(p);
    } catch {}
  }
  results.push(
    openDebug.length === 0
      ? record("TC_080", "No Open Debug Pages", "pass", `${debugPaths.length} common path(s) checked`)
      : record("TC_080", "No Open Debug Pages", "fail", `Publicly accessible: ${openDebug.join(", ")}`)
  );

  return results;
}
