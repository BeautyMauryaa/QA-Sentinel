// backend/utils/selectors.js

// A central directory for site structure patterns
export const patterns = {
  header: "header, .header, .navbar, #header, [role='banner'], [class*='header'], [class*='navbar']",
  nav: "nav, .mobile-menu, .menu-container, [role='navigation'], [class*='nav-menu'], [class*='mobile-menu']",
  logo: "img[src*='logo'], .site-logo, .header-logo, [class*='logo']",
  footer: "footer, .footer, .site-footer, [role='contentinfo'], [class*='footer']",
  navLinks: "a.nav-link, .menu-item a, nav a[href], .footer a[href]"
};

/**
 * Smart finder: tries to find an element based on our pattern dictionary
 */
export async function findElement(page, key) {
  const selector = patterns[key];
  if (!selector) return null;
  return await page.$(selector);
}

/**
 * Smart link extractor: grabs links from a scope defined by our patterns
 */
export async function findAllLinks(page, scopeKey) {
  const selector = patterns[scopeKey];
  return await page.$$eval(`${selector} a[href]`, (els) => 
    els.map((e) => e.getAttribute("href")).filter(Boolean)
  );
}