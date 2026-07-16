import { chromium } from "playwright";

export async function createBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  return browser;
}

export async function createContext(browser, viewportWidth = 1920) {
  return await browser.newContext({
    viewport: {
      width: viewportWidth,
      height: 1080,
    },

    ignoreHTTPSErrors: true,

    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  });
}