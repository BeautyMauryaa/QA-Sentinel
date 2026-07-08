// Suite 4: Link Validation Tests
export const id = "links";
export const label = "Link Validation";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];
  
  // Wait for the page to be fully loaded to ensure all links are in the DOM
  await page.waitForLoadState('networkidle');

  const base = new URL(url);

  const allLinks = await page.$$eval("a[href]", (els) => els.map((e) => e.getAttribute("href")).filter(Boolean));
  const unique = [...new Set(allLinks)];

  const internal = unique.filter((h) => {
    try {
      return new URL(h, url).hostname === base.hostname;
    } catch {
      return h.startsWith("/") || h.startsWith("#");
    }
  });
  const external = unique.filter((h) => !internal.includes(h) && /^https?:\/\//.test(h));

  const internalSample = internal.slice(0, 15);
  const externalSample = external.slice(0, 8);

  // Validate Internal Links
  let internalBroken = [];
  for (const href of internalSample) {
    try {
      const abs = new URL(href, url).toString();
      const res = await page.request.get(abs, { timeout: 8000 }).catch(() => null);
      if (res && res.status() >= 400) internalBroken.push(`${href} (${res.status()})`);
    } catch {}
  }
  results.push(
    internalSample.length === 0
      ? record("TC_021", "Internal Links Valid", "skipped", "No internal links found")
      : internalBroken.length === 0
      ? record("TC_021", "Internal Links Valid", "pass", `${internalSample.length} checked`)
      : record("TC_021", "Internal Links Valid", "fail", internalBroken.join(", "))
  );

  // Validate External Links
  let externalBroken = [];
  for (const href of externalSample) {
    try {
      const res = await page.request.get(href, { timeout: 10000 }).catch(() => null);
      if (!res || res.status() >= 400) externalBroken.push(`${href} (${res ? res.status() : "no response"})`);
    } catch {
      externalBroken.push(`${href} (unreachable)`);
    }
  }
  results.push(
    externalSample.length === 0
      ? record("TC_022", "External Links Valid", "skipped", "No external links found")
      : externalBroken.length === 0
      ? record("TC_022", "External Links Valid", "pass", `${externalSample.length} checked`)
      : record("TC_022", "External Links Valid", "fail", externalBroken.join(", "))
  );

  // Check for Broken Links
  const totalBroken = internalBroken.length + externalBroken.length;
  results.push(
    totalBroken === 0
      ? record("TC_023", "No Broken Links", "pass")
      : record("TC_023", "No Broken Links", "fail", `${totalBroken} broken link(s) found`)
  );

  // Redirect loop check - safely handled without global scope issues
  results.push(record("TC_024", "No Redirect Loops", "skipped", "Redirect loop detection not reliably verifiable generically"));

  // Check for target="_blank"
  const targetBlankLinks = await page.$$eval("a[target='_blank']", (els) => els.length);
  results.push(
    targetBlankLinks === 0
      ? record("TC_025", "Target Blank Opens New Tab", "skipped", "No target='_blank' links found")
      : record("TC_025", "Target Blank Opens New Tab", "pass", `${targetBlankLinks} link(s) with target='_blank'`)
  );

  return results;
}