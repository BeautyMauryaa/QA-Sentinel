import React, { useEffect, useState, useRef } from "react";
import { api } from "../api.js";

// ─── Severity map by test ID ──────────────────────────────────────────────────
const SEVERITY = {
  TC_001: "critical", TC_002: "major",   TC_003: "minor",   TC_004: "minor",   TC_005: "critical",
  TC_006: "major",   TC_007: "major",   TC_008: "minor",   TC_009: "minor",   TC_010: "major",
  TC_011: "major",   TC_012: "minor",   TC_013: "minor",   TC_014: "minor",   TC_015: "info",
  TC_016: "major",   TC_017: "major",   TC_018: "major",   TC_019: "minor",   TC_020: "minor",
  TC_021: "major",   TC_022: "minor",   TC_023: "critical", TC_024: "major",  TC_025: "minor",
  TC_026: "major",   TC_027: "major",   TC_028: "major",   TC_029: "minor",   TC_030: "minor",
  TC_031: "major",   TC_032: "major",   TC_033: "major",   TC_034: "minor",   TC_035: "minor",
  TC_036: "critical",TC_037: "major",   TC_038: "major",   TC_039: "minor",   TC_040: "info",
  TC_046: "major",   TC_047: "major",   TC_048: "minor",   TC_049: "minor",   TC_050: "info",
  TC_051: "critical",TC_052: "major",   TC_053: "major",   TC_054: "major",   TC_055: "major",
  TC_056: "major",   TC_057: "major",
  TC_066: "major",   TC_067: "major",   TC_068: "major",   TC_069: "major",   TC_070: "minor",
  TC_071: "major",   TC_072: "major",   TC_073: "major",   TC_074: "major",   TC_075: "major",
  TC_076: "critical",TC_077: "critical",TC_078: "major",   TC_079: "critical",TC_080: "major",
  TC_081: "major",   TC_082: "minor",   TC_083: "major",   TC_084: "minor",   TC_085: "minor",
  TC_086: "info",    TC_087: "info",    TC_088: "info",    TC_089: "info",    TC_090: "info",
  TC_091: "major",   TC_092: "major",   TC_093: "minor",   TC_094: "minor",
};

// ─── Human-friendly messages ──────────────────────────────────────────────────
const FRIENDLY = {
  TC_001: { title: "Homepage fails to load",            impact: "Visitors see a blank or error page.",                    fix: "Check your server, DNS, and hosting configuration." },
  TC_002: { title: "Console errors detected",           impact: "JavaScript errors may break interactive features.",      fix: "Open browser DevTools and fix the flagged errors." },
  TC_003: { title: "Page title is missing",             impact: "Harms SEO and confuses users in browser tabs.",          fix: "Add a descriptive <title> tag to your HTML." },
  TC_004: { title: "Favicon not found",                 impact: "Browser tab shows a blank icon — looks unprofessional.", fix: "Add a favicon.ico or <link rel='icon'> to your site." },
  TC_005: { title: "Main content not visible",          impact: "Page appears empty to users and search engines.",        fix: "Ensure your main content renders without JavaScript errors." },
  TC_006: { title: "Header not found",                  impact: "Users have no top navigation to orient themselves.",     fix: "Add a <header> or [role='banner'] element." },
  TC_007: { title: "Navigation menu missing",           impact: "Users cannot navigate between pages.",                   fix: "Add a <nav> element with links to main sections." },
  TC_008: { title: "Logo not detected",                 impact: "Brand identity is absent from the page.",               fix: "Add a logo image or SVG inside the header/nav." },
  TC_009: { title: "Logo doesn't link to homepage",    impact: "Users expect clicking the logo to go home.",             fix: "Wrap your logo in an <a href='/'> link." },
  TC_010: { title: "Navigation links not clickable",    impact: "Users cannot use the menu to browse the site.",         fix: "Ensure all nav links have valid href attributes." },
  TC_011: { title: "Broken navigation links (404)",     impact: "Clicking menu items leads to error pages.",             fix: "Update or remove the broken URLs in your navigation." },
  TC_012: { title: "Browser back button broken",        impact: "Users lose their place when navigating back.",           fix: "Avoid replacing browser history with pushState incorrectly." },
  TC_013: { title: "Browser forward button broken",     impact: "Forward navigation doesn't work as expected.",          fix: "Ensure history management is handled correctly." },
  TC_014: { title: "Active page not highlighted",       impact: "Users can't tell which page they're currently on.",     fix: "Add aria-current='page' to the active navigation link." },
  TC_015: { title: "Dropdown menus not detected",       impact: "Secondary navigation may be inaccessible.",             fix: "Verify dropdown menus open on hover or click." },
  TC_016: { title: "Footer not visible",                impact: "Contact info and legal links are missing.",              fix: "Add a <footer> element at the bottom of your page." },
  TC_017: { title: "Footer links not clickable",        impact: "Users can't access footer navigation.",                 fix: "Ensure footer links have valid href attributes." },
  TC_018: { title: "Footer links return errors",        impact: "Clicking footer links leads to broken pages.",          fix: "Audit and fix all footer URLs." },
  TC_019: { title: "Copyright text missing",            impact: "Legal protection language is absent.",                   fix: "Add a copyright notice to your footer." },
  TC_020: { title: "Contact information missing",       impact: "Visitors can't find how to reach you.",                 fix: "Add contact details (email, phone, address) to the footer." },
  TC_021: { title: "Broken internal links found",       impact: "Users hit dead ends when browsing your site.",          fix: "Run a link audit and fix or remove broken internal URLs." },
  TC_022: { title: "Broken external links found",       impact: "External links lead to missing pages.",                 fix: "Update or remove outdated external links." },
  TC_023: { title: "Broken links detected",             impact: "Visitors encounter 404 errors while browsing.",         fix: "Fix or redirect all broken links." },
  TC_024: { title: "Redirect loop detected",            impact: "Pages keep redirecting endlessly — users see an error.",fix: "Fix circular redirects in your server/CMS configuration." },
  TC_025: { title: "External links don't open new tab", impact: "Clicking external links navigates away from your site.",fix: "Add target='_blank' rel='noopener' to external links." },
  TC_026: { title: "Primary CTA not visible",           impact: "Users don't know what action to take.",                 fix: "Add a prominent call-to-action button above the fold." },
  TC_027: { title: "CTA button not clickable",          impact: "The main action button doesn't respond.",               fix: "Remove any overlapping elements blocking the CTA." },
  TC_028: { title: "CTA redirects to wrong page",       impact: "Users land on an unrelated page after clicking CTA.",  fix: "Update the CTA link to point to the correct destination." },
  TC_029: { title: "Multiple CTA buttons not working",  impact: "Secondary CTAs are broken or unresponsive.",           fix: "Test and fix all CTA buttons on the page." },
  TC_030: { title: "Sticky CTA not functioning",        impact: "The floating CTA disappears or doesn't scroll with page.", fix: "Check the sticky positioning CSS and scroll behavior." },
  TC_031: { title: "No form found on page",             impact: "Users can't submit inquiries or sign up.",              fix: "Ensure the form is present and not hidden by CSS." },
  TC_032: { title: "Required fields not marked",        impact: "Users may skip important fields without warning.",      fix: "Add required attribute or aria-required='true' to mandatory fields." },
  TC_033: { title: "Empty form submits without validation", impact: "Invalid data can be submitted.",                   fix: "Add HTML5 required attributes or JavaScript validation." },
  TC_034: { title: "Invalid email accepted",            impact: "Fake or mistyped emails pass through undetected.",      fix: "Use input type='email' or add pattern validation." },
  TC_035: { title: "Invalid phone number accepted",     impact: "Malformed phone numbers pass through.",                 fix: "Add a pattern attribute to your tel input field." },
  TC_036: { title: "Form submission fails",             impact: "Users cannot complete the contact or sign-up process.", fix: "Check your form action, server endpoint, and error handling." },
  TC_037: { title: "Error messages not displayed",      impact: "Users don't know why their submission failed.",         fix: "Add visible error messages near each invalid field." },
  TC_038: { title: "Submit button is disabled",         impact: "Users can't submit the form at all.",                   fix: "Remove the disabled attribute from the submit button." },
  TC_039: { title: "Submit button state not managed",   impact: "Users may click submit multiple times.",                fix: "Disable the button during submission to prevent duplicates." },
  TC_040: { title: "Form reset not working",            impact: "Users can't clear the form easily.",                    fix: "Add a reset button or implement a clear function." },
  TC_046: { title: "Hero image not loading",            impact: "The main visual is broken — poor first impression.",    fix: "Check the image URL and server response." },
  TC_047: { title: "Broken images on page",             impact: "Broken image icons appear, hurting credibility.",      fix: "Fix or replace all image URLs that return errors." },
  TC_048: { title: "Image dimensions invalid",          impact: "Images appear stretched or too small.",                 fix: "Set explicit width and height attributes on images." },
  TC_049: { title: "Lazy-loaded images not appearing",  impact: "Content below the fold never loads.",                  fix: "Check your lazy loading implementation and IntersectionObserver." },
  TC_050: { title: "Image click actions broken",        impact: "Clickable images or lightboxes don't respond.",        fix: "Verify click event handlers are attached correctly." },
  TC_051: { title: "Mobile layout broken",              impact: "Site is unusable on phones.",                           fix: "Add responsive CSS and test at 390px viewport width." },
  TC_052: { title: "Tablet layout broken",              impact: "Site doesn't display correctly on tablets.",            fix: "Add responsive breakpoints for tablet screen sizes." },
  TC_053: { title: "Hamburger menu not visible on mobile", impact: "Mobile users can't access navigation.",             fix: "Show a hamburger menu icon at mobile breakpoints." },
  TC_054: { title: "Hamburger menu doesn't open",       impact: "Mobile navigation is inaccessible.",                   fix: "Fix the toggle JavaScript for your mobile menu." },
  TC_055: { title: "Mobile navigation broken",          impact: "Users on phones can't navigate between pages.",        fix: "Ensure mobile nav links are visible and clickable after menu opens." },
  TC_056: { title: "Horizontal scrolling on mobile",    impact: "Content overflows the screen — poor mobile experience.",fix: "Add overflow-x: hidden and fix wide elements." },
  TC_057: { title: "Content overflows screen",          impact: "Elements extend beyond the viewport.",                  fix: "Use max-width: 100% and relative units on all elements." },
  TC_066: { title: "Images missing alt text",           impact: "Screen readers can't describe images to blind users.", fix: "Add descriptive alt attributes to all <img> tags." },
  TC_067: { title: "Buttons missing labels",            impact: "Screen readers announce buttons as unlabeled.",        fix: "Add aria-label or visible text to all buttons." },
  TC_068: { title: "Links missing accessible names",    impact: "Screen readers can't describe where links lead.",      fix: "Add descriptive text or aria-label to all links." },
  TC_069: { title: "Keyboard navigation broken",        impact: "Users who don't use a mouse can't navigate.",          fix: "Ensure all interactive elements are reachable with Tab key." },
  TC_070: { title: "Focus indicators not visible",      impact: "Keyboard users can't see which element is focused.",   fix: "Add visible :focus styles — don't use outline: none." },
  TC_071: { title: "Page load time too slow",           impact: "Users leave before the page finishes loading.",        fix: "Compress images, minify JS/CSS, and use a CDN." },
  TC_072: { title: "Images failed to load",             impact: "Broken images affect layout and credibility.",         fix: "Check image URLs and server response times." },
  TC_073: { title: "JavaScript files failed to load",   impact: "Interactive features may be completely broken.",      fix: "Check JS file paths, CDN URLs, and server logs." },
  TC_074: { title: "CSS files failed to load",          impact: "Page appears unstyled and broken.",                    fix: "Check CSS file paths and server configuration." },
  TC_075: { title: "Failed network requests detected",  impact: "Resources are missing, causing broken functionality.", fix: "Check browser network tab and fix failing requests." },
  TC_076: { title: "Site not using HTTPS",              impact: "User data is unencrypted — browsers show 'Not Secure'.",fix: "Install an SSL certificate and redirect HTTP to HTTPS." },
  TC_077: { title: "Mixed content detected",            impact: "Insecure resources on a secure page — browsers block them.", fix: "Update all resource URLs to use HTTPS." },
  TC_078: { title: "Cookies missing Secure flag",       impact: "Cookies can be intercepted over insecure connections.", fix: "Add the Secure flag to all cookies set by your server." },
  TC_079: { title: "Sensitive data exposed in source",  impact: "API keys or passwords visible in page source — security risk.", fix: "Move secrets to server-side environment variables." },
  TC_080: { title: "Debug pages publicly accessible",   impact: "Configuration files or debug info exposed to anyone.", fix: "Block access to debug URLs in your server configuration." },
  TC_081: { title: "Main heading missing",              impact: "Page has no H1 — hurts SEO and screen reader navigation.", fix: "Add a single descriptive <h1> to every page." },
  TC_082: { title: "No paragraph content found",        impact: "Page appears empty to search engines.",                fix: "Ensure body text is in <p> tags and renders in the DOM." },
  TC_083: { title: "Empty sections detected",           impact: "Placeholder sections make the page look unfinished.",  fix: "Remove empty containers or fill them with content." },
  TC_084: { title: "CTA text missing",                  impact: "Buttons have no labels — users don't know what they do.", fix: "Add clear action text to all call-to-action buttons." },
  TC_085: { title: "Placeholder content found",         impact: "'Lorem ipsum' or test content is visible to visitors.", fix: "Replace all placeholder text with real content." },
  TC_086: { title: "LinkedIn link broken",              impact: "Visitors can't reach your LinkedIn profile.",          fix: "Update the LinkedIn URL in your footer or social section." },
  TC_087: { title: "Facebook link broken",              impact: "Visitors can't reach your Facebook page.",            fix: "Update the Facebook URL in your footer or social section." },
  TC_088: { title: "Instagram link broken",             impact: "Visitors can't reach your Instagram profile.",        fix: "Update the Instagram URL in your footer or social section." },
  TC_089: { title: "X/Twitter link broken",             impact: "Visitors can't reach your X/Twitter profile.",       fix: "Update the X/Twitter URL in your footer or social section." },
  TC_090: { title: "YouTube link broken",               impact: "Visitors can't reach your YouTube channel.",         fix: "Update the YouTube URL in your footer or social section." },
  TC_091: { title: "404 page not shown for invalid URLs", impact: "Users see a blank or server error instead of a helpful 404.", fix: "Configure a custom 404 page in your server/CMS." },
  TC_092: { title: "404 page doesn't load correctly",   impact: "Error page itself is broken.",                        fix: "Fix the 404 template and ensure it returns status 404." },
  TC_093: { title: "404 page has no homepage link",     impact: "Users are stuck with no way to get back.",            fix: "Add a 'Go to Homepage' link on your 404 page." },
  TC_094: { title: "Error page styling broken",         impact: "404 page looks unstyled or broken.",                  fix: "Ensure CSS loads correctly on the error page." },
};

const SUITE_LABELS = {
  pageLoad: "Page Load", navigation: "Navigation", footer: "Footer",
  links: "Link Validation", cta: "CTA", forms: "Forms", images: "Images",
  accessibility: "Accessibility", content: "Content Verification",
  contentMatch: "Content Match", social: "Social Media",
  performance: "Performance", security: "Security", mobile: "Mobile Responsive",
  errorPage: "Error Pages",
};

const SEV_CONFIG = {
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    dot: "bg-red-400",    icon: "🔴" },
  major:    { label: "Major",    color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", dot: "bg-orange-400", icon: "🟠" },
  minor:    { label: "Minor",    color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", dot: "bg-yellow-400", icon: "🟡" },
  info:     { label: "Info",     color: "text-steel",      bg: "bg-panelborder",   border: "border-panelborder",   dot: "bg-steel",      icon: "🔵" },
};

function getSeverity(testId) {
  return SEVERITY[testId] || "info";
}

function getFriendly(testId, fallbackName) {
  return FRIENDLY[testId] || { title: fallbackName, impact: null, fix: null };
}

function calcHealthScore(results) {
  if (!results || results.length === 0) return 100;
  const fails = results.filter((r) => r.status === "fail");
  let penalty = 0;
  for (const f of fails) {
    const sev = getSeverity(f.test_id);
    if (sev === "critical") penalty += 20;
    else if (sev === "major") penalty += 8;
    else if (sev === "minor") penalty += 3;
    else penalty += 1;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultsDashboard({ runId }) {
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const pollRef = useRef(null);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const data = await api.getRun(runId);
        if (stopped) return;
        setRun(data);
        if (data.status === "queued" || data.status === "running") {
          pollRef.current = setTimeout(poll, 1200);
        }
      } catch (err) {
        if (!stopped) setError(err.message);
      }
    }
    poll();
    return () => { stopped = true; clearTimeout(pollRef.current); };
  }, [runId]);

  if (error) return <div className="text-signal-fail font-mono text-sm">✗ {error}</div>;
  if (!run) return <div className="text-steel font-mono text-sm animate-pulse">Loading run…</div>;

  const isLive = run.status === "queued" || run.status === "running";
  const allResults = run.results || [];
  const failedResults = allResults.filter((r) => r.status === "fail");
  const healthScore = calcHealthScore(allResults);

  const criticalFails = failedResults.filter((r) => getSeverity(r.test_id) === "critical").length;
  const majorFails    = failedResults.filter((r) => getSeverity(r.test_id) === "major").length;
  const minorFails    = failedResults.filter((r) => getSeverity(r.test_id) === "minor").length;

  const healthStatus =
    criticalFails > 0 ? { label: "Critical Issues Found", color: "text-red-400", icon: "✗" }
    : majorFails > 0  ? { label: "Needs Attention",        color: "text-orange-400", icon: "⚠" }
    : minorFails > 0  ? { label: "Minor Issues Only",      color: "text-yellow-400", icon: "!" }
    : isLive          ? { label: "Scanning…",              color: "text-signal-run", icon: "…" }
    :                   { label: "All Checks Passed",       color: "text-signal-pass", icon: "✓" };

  // Group by suite
  const grouped = allResults.reduce((acc, r) => {
    (acc[r.suite_id] = acc[r.suite_id] || []).push(r);
    return acc;
  }, {});

  // Filter + search
  function matchesFilter(r) {
    if (filter === "passed")   return r.status === "pass";
    if (filter === "failed")   return r.status === "fail";
    if (filter === "skipped")  return r.status === "skipped";
    if (filter === "critical") return r.status === "fail" && getSeverity(r.test_id) === "critical";
    if (filter === "screenshots") return !!r.screenshot_path;
    return true;
  }

  function matchesSearch(r) {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.test_name?.toLowerCase().includes(q) ||
      r.test_id?.toLowerCase().includes(q) ||
      r.error_message?.toLowerCase().includes(q) ||
      SUITE_LABELS[r.suite_id]?.toLowerCase().includes(q)
    );
  }

  function toggleCollapse(suiteId) {
    setCollapsed((prev) => ({ ...prev, [suiteId]: !prev[suiteId] }));
  }

  // Top recommendations from critical/major failures
  const recommendations = failedResults
    .filter((r) => ["critical", "major"].includes(getSeverity(r.test_id)))
    .slice(0, 5)
    .map((r) => ({ ...r, friendly: getFriendly(r.test_id, r.test_name), sev: getSeverity(r.test_id) }));

  return (
    <div className="space-y-6">

      {/* ── Health Score Card ── */}
      <div className="bg-panel border border-panelborder rounded-md p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="font-mono text-[10px] text-steel tracking-widest mb-1">WEBSITE HEALTH SCORE</div>
            <div className="flex items-end gap-3">
              <span className={`font-mono text-5xl font-bold leading-none ${
                healthScore >= 80 ? "text-signal-pass" : healthScore >= 50 ? "text-yellow-400" : "text-red-400"
              }`}>{healthScore}</span>
              <span className="font-mono text-xl text-steel/40 mb-1">/100</span>
            </div>
            <div className={`font-mono text-sm mt-2 font-semibold ${healthStatus.color}`}>
              {healthStatus.icon} {healthStatus.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <SevStat label="Critical" value={criticalFails} color="text-red-400"    border="border-red-400/20" />
            <SevStat label="Major"    value={majorFails}    color="text-orange-400" border="border-orange-400/20" />
            <SevStat label="Minor"    value={minorFails}    color="text-yellow-400" border="border-yellow-400/20" />
            <SevStat label="Info"     value={failedResults.filter(r => getSeverity(r.test_id) === "info").length} color="text-steel" border="border-panelborder" />
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 bg-panelborder rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${
              healthScore >= 80 ? "bg-signal-pass" : healthScore >= 50 ? "bg-yellow-400" : "bg-red-400"
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <MiniStat label="Total"   value={allResults.length} color="text-mist" />
          <MiniStat label="Passed"  value={run.passed}        color="text-signal-pass" />
          <MiniStat label="Failed"  value={run.failed}        color="text-signal-fail" />
          <MiniStat label="Skipped" value={run.skipped}       color="text-signal-skip" />
        </div>

        {/* Scan metadata */}
        <div className="mt-4 pt-4 border-t border-panelborder flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] text-steel">
          <span>🌐 {new URL(run.url).hostname}</span>
          <span>🕐 {new Date(run.started_at).toLocaleTimeString()}</span>
          {run.completed_at && (
            <span>⏱ {Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)}s duration</span>
          )}
          <span>🧪 {run.suites?.length || 0} suites</span>
          <span>🖥 Chromium · Desktop</span>
          <StatusBadge status={run.status} />
        </div>
      </div>

      {/* ── Live indicator ── */}
      {isLive && (
        <div className="font-mono text-xs text-signal-run flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-signal-run pulse-dot" />
          Scanning… results appear as each suite completes
        </div>
      )}

      {/* ── Recommended Actions ── */}
      {!isLive && recommendations.length > 0 && (
        <div className="bg-panel border border-panelborder rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-panelborder font-mono text-xs uppercase tracking-widest text-mist">
            ⚡ Recommended Actions
          </div>
          <ul className="divide-y divide-panelborder">
            {recommendations.map((r, i) => {
              const sc = SEV_CONFIG[r.sev];
              return (
                <li key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="font-mono text-xs mt-0.5">{i === 0 ? "🔝" : `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${sc.border} ${sc.color} ${sc.bg}`}>
                        {sc.label}
                      </span>
                      <span className="font-sans text-sm text-mist font-medium">{r.friendly.title}</span>
                    </div>
                    {r.friendly.fix && (
                      <div className="font-mono text-xs text-steel/70">→ {r.friendly.fix}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Score by category ── */}
      {!isLive && run.suites && run.suites.length > 0 && (
        <div className="bg-panel border border-panelborder rounded-md p-4">
          <div className="font-mono text-[10px] text-steel tracking-widest mb-3">SCORE BY CATEGORY</div>
          <div className="space-y-2">
            {run.suites.map((suiteId) => {
              const suiteResults = grouped[suiteId] || [];
              if (suiteResults.length === 0) return null;
              const passed = suiteResults.filter((r) => r.status === "pass").length;
              const total  = suiteResults.filter((r) => r.status !== "skipped").length;
              const pct    = total === 0 ? 100 : Math.round((passed / total) * 100);
              return (
                <div key={suiteId} className="flex items-center gap-3">
                  <div className="w-28 font-mono text-[10px] text-steel truncate flex-shrink-0">
                    {SUITE_LABELS[suiteId] || suiteId}
                  </div>
                  <div className="flex-1 h-1.5 bg-panelborder rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 80 ? "bg-signal-pass" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`font-mono text-[10px] w-8 text-right flex-shrink-0 ${
                    pct >= 80 ? "text-signal-pass" : pct >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters + Search ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { id: "all",         label: "All" },
          { id: "failed",      label: `Failed ${run.failed > 0 ? `(${run.failed})` : ""}` },
          { id: "critical",    label: `Critical ${criticalFails > 0 ? `(${criticalFails})` : ""}` },
          { id: "passed",      label: "Passed" },
          { id: "skipped",     label: "Skipped" },
          { id: "screenshots", label: "With Screenshots" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
              filter === f.id
                ? "border-signal-run bg-signal-run/10 text-mist"
                : "border-panelborder text-steel hover:border-steel/60"
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full bg-panel border border-panelborder rounded-md px-3 py-1.5 text-mist font-mono text-xs outline-none focus:border-signal-run transition-colors placeholder:text-steel/40"
          />
        </div>
      </div>

      {/* ── Suite blocks ── */}
      {run.suites.map((suiteId) => {
        const results = grouped[suiteId];
        const label   = SUITE_LABELS[suiteId] || suiteId;
        const isCollapsed = collapsed[suiteId];

        const visible = results
          ? results.filter((r) => matchesFilter(r) && matchesSearch(r))
          : [];

        if (results && visible.length === 0 && (filter !== "all" || search)) return null;

        const hasFail = results?.some((r) => r.status === "fail");
        const suiteScore = results
          ? Math.round((results.filter(r => r.status === "pass").length /
              Math.max(1, results.filter(r => r.status !== "skipped").length)) * 100)
          : null;

        return (
          <div
            key={suiteId}
            className={`bg-panel border rounded-md overflow-hidden transition-colors ${
              hasFail ? "border-signal-fail/30" : "border-panelborder"
            }`}
          >
            {/* Suite header */}
            <button
              type="button"
              onClick={() => results && toggleCollapse(suiteId)}
              className="w-full px-4 py-3 border-b border-panelborder flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {hasFail && <span className="w-1.5 h-1.5 rounded-full bg-signal-fail flex-shrink-0" />}
                <span className="font-mono text-xs uppercase tracking-widest text-mist">{label}</span>
                {results && (
                  <span className="font-mono text-[10px] text-steel/60">{results.length} checks</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[10px]">
                {suiteScore !== null && (
                  <span className={
                    suiteScore >= 80 ? "text-signal-pass" : suiteScore >= 50 ? "text-yellow-400" : "text-red-400"
                  }>{suiteScore}%</span>
                )}
                {results ? (
                  <span className="text-steel/40">{isCollapsed ? "▸" : "▾"}</span>
                ) : (
                  <span className="text-signal-run">scanning…</span>
                )}
              </div>
            </button>

            {/* Loading bar */}
            {!results && (
              <div className="h-0.5 bg-panelborder relative overflow-hidden">
                <div className="absolute inset-y-0 w-1/3 bg-signal-run/60"
                  style={{ animation: "scan 1.2s linear infinite" }} />
              </div>
            )}

            {/* Results */}
            {results && !isCollapsed && (
              <ul className="divide-y divide-panelborder">
                {visible.map((r) => (
                  <ResultRow key={r.id} r={r} onScreenshot={setLightbox} />
                ))}
                {visible.length === 0 && (
                  <li className="px-4 py-3 font-mono text-xs text-steel/40">
                    No results match the current filter.
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          onClick={() => setLightbox(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox}
              alt="failure screenshot"
              className="max-h-[80vh] max-w-full rounded-md border border-panelborder"
            />
            <div className="flex gap-3 mt-3 justify-center">
              <a
                href={lightbox}
                download
                className="font-mono text-xs text-signal-run hover:underline"
              >
                ↓ Download
              </a>
              <button
                onClick={() => setLightbox(null)}
                className="font-mono text-xs text-steel hover:text-mist"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single result row ────────────────────────────────────────────────────────

function ResultRow({ r, onScreenshot }) {
  const [expanded, setExpanded] = useState(false);
  const sev = getSeverity(r.test_id);
  const sc  = SEV_CONFIG[sev];
  const friendly = getFriendly(r.test_id, r.test_name);

  const isFail    = r.status === "fail";
  const isPass    = r.status === "pass";
  const isSkipped = r.status === "skipped";

  return (
    <li className={`px-4 py-3 ${isFail ? sc.bg : ""}`}>
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <span className={`mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isFail ? sc.dot : isPass ? "bg-signal-pass" : "bg-signal-skip"
        }`} />

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] text-steel/50">{r.test_id}</span>

            {/* Severity badge — only on failures */}
            {isFail && (
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${sc.border} ${sc.color}`}>
                {sc.icon} {sc.label}
              </span>
            )}

            {/* Test name — human friendly on fail */}
            <span className="font-sans text-sm text-mist">
              {isFail ? friendly.title : r.test_name}
            </span>

            {/* Pass/skip badge */}
            {isPass && (
              <span className="font-mono text-[10px] text-signal-pass tracking-widest">PASS</span>
            )}
            {isSkipped && (
              <span className="font-mono text-[10px] text-signal-skip tracking-widest">SKIP</span>
            )}
          </div>

          {/* Failure details */}
          {isFail && (
            <div className="mt-1.5 space-y-1">
              {friendly.impact && (
                <div className="font-mono text-xs text-steel/70">
                  <span className="text-steel/40">Impact: </span>{friendly.impact}
                </div>
              )}
              {friendly.fix && (
                <div className="font-mono text-xs text-signal-pass/80">
                  <span className="text-steel/40">Fix: </span>{friendly.fix}
                </div>
              )}

              {/* Technical log — collapsed by default */}
              {r.error_message && (
                <div className="mt-1">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="font-mono text-[10px] text-steel/50 hover:text-steel transition-colors"
                  >
                    {expanded ? "▾ hide technical log" : "▸ show technical log"}
                  </button>
                  {expanded && (
                    <div className="mt-1 px-3 py-2 bg-black/30 rounded text-[10px] font-mono text-steel/50 break-all border border-panelborder">
                      {r.error_message}
                    </div>
                  )}
                </div>
              )}

              {/* Screenshot */}
              {r.screenshot_path && (
                <button
                  onClick={() => onScreenshot(r.screenshot_path)}
                  className="font-mono text-[10px] text-signal-run hover:underline mt-1"
                >
                  📷 view screenshot →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SevStat({ label, value, color, border }) {
  return (
    <div className={`bg-panel border ${border} rounded-md px-3 py-2 min-w-[64px]`}>
      <div className={`text-xl font-mono font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-steel mt-0.5">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-mono font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-steel">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    queued:    "text-signal-skip border-signal-skip/40 bg-signal-skip/10",
    running:   "text-signal-run border-signal-run/40 bg-signal-run/10",
    completed: "text-signal-pass border-signal-pass/40 bg-signal-pass/10",
    failed:    "text-signal-fail border-signal-fail/40 bg-signal-fail/10",
  };
  return (
    <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${map[status] || map.queued}`}>
      {status?.toUpperCase()}
    </span>
  );
}