import { findElement, findAllLinks } from '../utils/selectors.js';

export const id = "navigation"; // <--- THIS IS REQUIRED BY SUITEREGISTRY.JS
export const label = "Navigation";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  // Logic is now clean and readable
  const header = await findElement(page, 'header');
  results.push(header ? record("TC_006", "Header Visible", "pass") : record("TC_006", "Header Visible", "fail", "Header not found"));

  const nav = await findElement(page, 'nav');
  results.push(nav ? record("TC_007", "Navigation Visible", "pass") : record("TC_007", "Navigation Visible", "fail", "Nav not found"));

  const navLinks = await findAllLinks(page, 'navLinks');
  results.push(navLinks.length > 0 ? record("TC_010", "Links Clickable", "pass") : record("TC_010", "Links Clickable", "fail", "No links found"));

  return results;
}