import * as pageLoad from "./suites/pageLoad.js";
import * as navigation from "./suites/navigation.js";
import * as footer from "./suites/footer.js";
import * as links from "./suites/links.js";
import * as cta from "./suites/cta.js";
import * as forms from "./suites/forms.js";
import * as inputFields from "./suites/inputFields.js";
import * as images from "./suites/images.js";
import * as mobile from "./suites/mobile.js";
import * as uiComponents from "./suites/uiComponents.js";
import * as accessibility from "./suites/accessibility.js";
import * as performance from "./suites/performance.js";
import * as security from "./suites/security.js";
import * as content from "./suites/content.js";
import * as social from "./suites/social.js";
import * as errorPage from "./suites/errorPage.js";

export const SUITES = [
  pageLoad,
  navigation,
  footer,
  links,
  cta,
  forms,
  inputFields,
  images,
  uiComponents,
  accessibility,
  content,
  social,
  performance,
  security,
  mobile,
  errorPage,
];

export const SUITE_MAP = Object.fromEntries(SUITES.map((s) => [s.id, s]));