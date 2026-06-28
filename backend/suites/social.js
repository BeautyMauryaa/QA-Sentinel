// Suite 15: Social Media Tests
export const id = "social";
export const label = "Social Media";

const PLATFORMS = [
  { tid: "TC_086", name: "LinkedIn Link Works", host: "linkedin.com" },
  { tid: "TC_087", name: "Facebook Link Works", host: "facebook.com" },
  { tid: "TC_088", name: "Instagram Link Works", host: "instagram.com" },
  { tid: "TC_089", name: "X/Twitter Link Works", host: ["twitter.com", "x.com"] },
  { tid: "TC_090", name: "YouTube Link Works", host: "youtube.com" },
];

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const allHrefs = await page.$$eval("a[href]", (els) => els.map((e) => e.getAttribute("href")).filter(Boolean));

  for (const platform of PLATFORMS) {
    const hosts = Array.isArray(platform.host) ? platform.host : [platform.host];
    const match = allHrefs.find((h) => hosts.some((host) => h.includes(host)));
    if (!match) {
      results.push(record(platform.tid, platform.name, "skipped", `No ${hosts[0]} link found in page`));
      continue;
    }
    try {
      const res = await page.request.get(match, { timeout: 10000 }).catch(() => null);
      const ok = res && res.status() < 400;
      results.push(
        ok
          ? record(platform.tid, platform.name, "pass")
          : record(platform.tid, platform.name, "fail", `${match} returned ${res ? res.status() : "no response"}`)
      );
    } catch (err) {
      results.push(record(platform.tid, platform.name, "fail", err.message));
    }
  }

  return results;
}
