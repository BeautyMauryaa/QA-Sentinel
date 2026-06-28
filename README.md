# QA Sentinel

A web-based automation platform that runs a generic Playwright E2E test suite
against any public website — no login, no per-site config — and shows
pass/fail results, failure screenshots, run history, and a regression
comparison between two runs.

No accounts. No JWT. Just a URL in, a report out.

---

## What's implemented

**Backend** (`/backend`) — Node + Express + Playwright

| Suite                | Test IDs   | Notes                                                                          |
| -------------------- | ---------- | ------------------------------------------------------------------------------ |
| Page Load            | TC_001–005 | status code, console errors, title, favicon, body renders                      |
| Navigation           | TC_006–015 | header/nav/logo detection, link 404 sampling, back/forward, dropdown existence |
| Footer               | TC_016–020 | visibility, link health, copyright/contact text                                |
| Link Validation      | TC_021–025 | internal/external link health (sampled), target=\_blank                        |
| CTA                  | TC_026–030 | heuristic CTA detection — see caveat below                                     |
| Forms                | TC_031–040 | **detect-only**, see caveat below                                              |
| Images               | TC_046–050 | broken images, dimensions, lazy-load, clickable images                         |
| Accessibility Basics | TC_066–070 | alt text, labels, keyboard nav, focus rings                                    |
| Content Verification | TC_081–085 | heading/paragraph presence, placeholder text                                   |
| Social Media         | TC_086–090 | platform link detection + reachability                                         |
| Performance Basics   | TC_071–075 | load time, asset load failures                                                 |
| Security Smoke       | TC_076–080 | HTTPS, mixed content, cookie flags, common debug paths                         |
| Mobile Responsive    | TC_051–057 | mobile/tablet viewport, hamburger menu, horizontal scroll                      |
| Error Page           | TC_091–094 | 404 status, page content, homepage link, styling                               |

Regression comparison engine (`compare.js`) matches results across two runs by
**test_id**, not test name, and buckets them into Fixed / Existing / New /
Stable, exactly as scoped in the regression-engine doc.

Storage is a small dependency-free JSON file store (`backend/data/qa-sentinel.json`)
rather than Postgres — same shape as the two-table schema from the spec
(`test_runs`, `test_results`), just file-backed so there's nothing to install
or configure to get running.

**Frontend** (`/frontend`) — React + Vite + Tailwind, dark "CI log" aesthetic
(monospace test IDs, signal-colored status dots, live polling while a run is
in progress). Three views: Run, History, Compare.

---

## Two caveats worth knowing about

1. **Forms are detect-only by design.** QA Sentinel never submits real data
   into a live form, because this tool can be pointed at _anyone's_ production
   site — actually submitting would mean spamming a stranger's contact form,
   CRM, or inbox on every test run. TC_036 ("Successful Submission") is always
   reported as skipped with an explanation. Required-field, empty-validation,
   and invalid-email/phone checks still run by interacting with the form
   without clicking a real submit-and-persist action where avoidable.
   If you want real submission testing, point the tool at a staging URL and
   extend `suites/forms.js` with a config-driven field map.

2. **CTA, navigation "logo", and "active page" checks are heuristic.** There's
   no universal way to know which element is "the CTA" or "the logo" on an
   arbitrary site — these suites use common patterns (`class*='cta'`,
   `class*='hero'`, an image inside a header link, `aria-current`, etc.) and
   report what they find. Treat fails in these suites as "worth a human
   look," not certainties.

---

## Running it locally

### Backend

```bash
cd backend
npm install
npx playwright install chromium   # downloads the headless browser, one-time
npm start                          # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/screenshots` to `localhost:4000`, so
just open the frontend URL — no extra config needed.

### API surface

```
GET  /api/suites                     list available suites
POST /api/tests/run                   { url, suites: [...] } -> { runId, status }
GET  /api/tests/:id                   run status + all results
GET  /api/history                     last 100 runs
GET  /api/tests/compare?run1=&run2=   regression report between two runs
```

---

## What I'd build next

- Config-driven form testing (field map + test data) for real submission checks
- Scheduled/recurring runs
- Visual regression (screenshot diffing) for the "styling correct" style checks
- Auth, if/when multi-user access matters — intentionally left out per the
  original MVP scope doc
