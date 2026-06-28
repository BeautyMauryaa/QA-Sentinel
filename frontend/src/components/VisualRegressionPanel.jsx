import React, { useState, useEffect } from "react";

const BASE = "/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

const STATUS_CONFIG = {
  pass:       { color: "text-signal-pass", bg: "bg-signal-pass/10", border: "border-signal-pass/30", label: "No Change",     icon: "✓" },
  minor:      { color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30",  label: "Minor Change",  icon: "~" },
  fail:       { color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/30",     label: "Visual Change", icon: "✗" },
  no_baseline:{ color: "text-steel",       bg: "bg-panelborder",    border: "border-panelborder",    label: "No Baseline",   icon: "?" },
  error:      { color: "text-signal-fail", bg: "bg-signal-fail/10", border: "border-signal-fail/30", label: "Error",         icon: "!" },
};

const VIEWPORT_ICONS = { desktop: "🖥", mobile: "📱", tablet: "📋" };

export default function VisualRegressionPanel() {
  const [url, setUrl]           = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [baselines, setBaselines] = useState([]);
  const [baseline, setBaseline]   = useState(null); // baseline for current URL
  const [capturing, setCapturing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [report, setReport]       = useState(null);
  const [error, setError]         = useState(null);
  const [lightbox, setLightbox]   = useState(null); // { before, after, diff, label }
  const [activeView, setActiveView] = useState("diff"); // baseline | compare

  // Load all baselines on mount
  useEffect(() => {
    get("/visual/baselines")
      .then(setBaselines)
      .catch(() => {});
  }, []);

  // Check if baseline exists for current URL
  useEffect(() => {
    if (!url.trim()) { setBaseline(null); return; }
    let normalized;
    try { normalized = new URL(url.trim()).toString(); } catch { setBaseline(null); return; }
    get(`/visual/baseline?url=${encodeURIComponent(normalized)}`)
      .then(setBaseline)
      .catch(() => setBaseline(null));
  }, [url]);

  async function handleCapture() {
    setError(null);
    if (!url.trim()) { setError("Enter a URL first."); return; }
    setCapturing(true);
    try {
      const result = await post("/visual/baseline", { url: url.trim(), username, password });
      setBaseline(result.manifest);
      setBaselines((prev) => {
        const filtered = prev.filter((b) => b.url !== result.manifest.url);
        return [result.manifest, ...filtered];
      });
      setReport(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCapturing(false);
    }
  }

  async function handleCompare() {
    setError(null);
    if (!url.trim()) { setError("Enter a URL first."); return; }
    if (!baseline)   { setError("Capture a baseline first."); return; }
    setComparing(true);
    try {
      const result = await post("/visual/compare", { url: url.trim(), username, password });
      setReport(result);
      setActiveView("compare");
    } catch (err) {
      setError(err.message);
    } finally {
      setComparing(false);
    }
  }

  async function handleDeleteBaseline(targetUrl) {
    try {
      await del(`/visual/baseline?url=${encodeURIComponent(targetUrl)}`);
      setBaselines((prev) => prev.filter((b) => b.url !== targetUrl));
      if (baseline?.url === targetUrl) setBaseline(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const hasBaseline = !!baseline;
  const scoreColor = !report ? "" :
    report.summary.failed === 0 ? "text-signal-pass" :
    report.summary.minor > 0 && report.summary.failed === 0 ? "text-yellow-400" :
    "text-red-400";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h2 className="font-sans text-xl font-semibold text-mist mb-1">
          Visual Regression
        </h2>
        <p className="text-steel text-sm">
          Capture a baseline screenshot of any page, then compare after changes
          to see exactly what shifted — pixel by pixel, across desktop, tablet,
          and mobile.
        </p>
      </div>

      {/* ── URL + Auth ── */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
            Target URL
          </label>
          <div className="flex items-center gap-2 bg-panel border border-panelborder rounded-md px-4 py-3 focus-within:border-signal-run transition-colors">
            <span className="text-signal-run font-mono text-sm">$</span>
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setReport(null); setError(null); }}
              placeholder="https://example.com"
              className="flex-1 bg-transparent outline-none text-mist font-mono text-sm placeholder:text-steel/50"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAuth((v) => !v)}
          className="flex items-center gap-2 font-mono text-xs text-steel hover:text-mist transition-colors"
        >
          <span className="text-[10px]">{showAuth ? "▾" : "▸"}</span>
          Authentication
          <span className="text-steel/40">(optional)</span>
        </button>

        {showAuth && (
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors" />
          </div>
        )}
      </div>

      {/* ── Baseline status ── */}
      {url.trim() && (
        <div className={`rounded-md border px-4 py-3 flex items-center justify-between gap-3 ${
          hasBaseline
            ? "border-signal-pass/30 bg-signal-pass/5"
            : "border-panelborder bg-panel"
        }`}>
          <div className="font-mono text-xs">
            {hasBaseline ? (
              <>
                <span className="text-signal-pass">✓ Baseline captured</span>
                <span className="text-steel/50 ml-3">
                  {new Date(baseline.capturedAt).toLocaleString()} ·{" "}
                  {baseline.screenshots?.length} viewport(s)
                </span>
              </>
            ) : (
              <span className="text-steel/60">No baseline yet for this URL</span>
            )}
          </div>
          {hasBaseline && (
            <button
              onClick={() => handleDeleteBaseline(baseline.url)}
              className="font-mono text-[10px] text-steel/40 hover:text-signal-fail transition-colors"
            >
              ✕ reset
            </button>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCapture}
          disabled={capturing || comparing}
          className="bg-panel border border-panelborder text-mist font-sans font-semibold text-sm rounded-md py-3 hover:border-steel/60 disabled:opacity-50 transition-colors"
        >
          {capturing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mist pulse-dot" />
              Capturing…
            </span>
          ) : (
            hasBaseline ? "↺ Recapture Baseline" : "📷 Capture Baseline"
          )}
        </button>

        <button
          onClick={handleCompare}
          disabled={!hasBaseline || capturing || comparing}
          className="bg-signal-run text-ink font-sans font-semibold text-sm rounded-md py-3 hover:bg-signal-run/90 disabled:opacity-50 transition-colors"
        >
          {comparing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ink pulse-dot" />
              Comparing…
            </span>
          ) : (
            "⚡ Run Comparison"
          )}
        </button>
      </div>

      {error && (
        <div className="text-signal-fail font-mono text-xs border border-signal-fail/40 bg-signal-fail/10 rounded-md px-3 py-2">
          ✗ {error}
        </div>
      )}

      {/* ── Comparison Report ── */}
      {report && (
        <ComparisonReport
          report={report}
          scoreColor={scoreColor}
          activeView={activeView}
          setActiveView={setActiveView}
          onLightbox={setLightbox}
        />
      )}

      {/* ── All baselines list ── */}
      {baselines.length > 0 && !report && (
        <div className="bg-panel border border-panelborder rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-panelborder font-mono text-[10px] uppercase tracking-widest text-steel">
            Stored Baselines
          </div>
          <ul className="divide-y divide-panelborder">
            {baselines.map((b) => (
              <li key={b.url} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-mist truncate">{b.url}</div>
                  <div className="font-mono text-[10px] text-steel/50 mt-0.5">
                    {new Date(b.capturedAt).toLocaleString()} · {b.screenshots?.length} viewports
                  </div>
                </div>
                <button
                  onClick={() => { setUrl(b.url); setBaseline(b); }}
                  className="font-mono text-[10px] text-signal-run hover:underline flex-shrink-0"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteBaseline(b.url)}
                  className="font-mono text-[10px] text-steel/40 hover:text-signal-fail flex-shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox lightbox={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ─── Comparison report ────────────────────────────────────────────────────────

function ComparisonReport({ report, scoreColor, activeView, setActiveView, onLightbox }) {
  const { summary, results } = report;
  const overallStatus =
    summary.failed > 0 ? "Visual changes detected"
    : summary.minor > 0 ? "Minor pixel differences"
    : "No visual changes";

  return (
    <div className="space-y-4 border-t border-panelborder pt-6">

      {/* Summary */}
      <div className="bg-panel border border-panelborder rounded-md p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="font-mono text-[10px] text-steel tracking-widest mb-1">
              VISUAL COMPARISON RESULT
            </div>
            <div className={`font-mono text-2xl font-bold ${
              summary.failed > 0 ? "text-red-400" :
              summary.minor > 0 ? "text-yellow-400" : "text-signal-pass"
            }`}>
              {overallStatus}
            </div>
            <div className="font-mono text-[10px] text-steel/50 mt-1">
              Baseline: {new Date(report.baselineCapturedAt).toLocaleString()}
              {" · "}
              Compared: {new Date(report.comparedAt).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <SevStat label="No Change"  value={summary.passed} color="text-signal-pass" border="border-signal-pass/20" />
            <SevStat label="Minor"      value={summary.minor}  color="text-yellow-400"  border="border-yellow-400/20" />
            <SevStat label="Changed"    value={summary.failed} color="text-red-400"     border="border-red-400/20" />
          </div>
        </div>
      </div>

      {/* Viewport results */}
      <div className="space-y-4">
        {results.map((r) => (
          <ViewportResult key={r.key} result={r} onLightbox={onLightbox} />
        ))}
      </div>
    </div>
  );
}

// ─── Single viewport result ───────────────────────────────────────────────────

function ViewportResult({ result, onLightbox }) {
  const sc = STATUS_CONFIG[result.status] || STATUS_CONFIG.error;

  return (
    <div className={`bg-panel border ${sc.border} rounded-md overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-panelborder flex items-center justify-between ${sc.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{VIEWPORT_ICONS[result.key] || "🖥"}</span>
          <div>
            <span className="font-mono text-sm text-mist capitalize">{result.label}</span>
            {result.diffPercent !== undefined && (
              <span className="font-mono text-[10px] text-steel/60 ml-3">
                {result.diffPercent}% pixels changed · {result.diffPixels?.toLocaleString()} px
              </span>
            )}
          </div>
        </div>
        <span className={`font-mono text-xs px-2 py-1 rounded border ${sc.border} ${sc.color}`}>
          {sc.icon} {sc.label}
        </span>
      </div>

      {/* Three-panel image viewer */}
      {result.baselineUrl && result.currentUrl && result.diffUrl && (
        <div className="grid grid-cols-3 gap-0 divide-x divide-panelborder">
          {[
            { label: "Baseline",  src: result.baselineUrl, view: "before" },
            { label: "Current",   src: result.currentUrl,  view: "after" },
            { label: "Diff",      src: result.diffUrl,     view: "diff" },
          ].map(({ label, src, view }) => (
            <div key={view} className="p-3 space-y-2">
              <div className="font-mono text-[10px] text-steel/60 uppercase tracking-widest">
                {label}
              </div>
              <button
                onClick={() => onLightbox({
                  before: result.baselineUrl,
                  after:  result.currentUrl,
                  diff:   result.diffUrl,
                  label:  result.label,
                  active: view,
                })}
                className="block w-full"
              >
                <img
                  src={src}
                  alt={label}
                  className="w-full rounded border border-panelborder hover:border-signal-run transition-colors object-top object-cover"
                  style={{ maxHeight: "200px" }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {result.message && (
        <div className="px-4 py-3 font-mono text-xs text-steel/60">{result.message}</div>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ lightbox, onClose }) {
  const [active, setActive] = useState(lightbox.active || "diff");

  const views = [
    { id: "before", label: "Baseline", src: lightbox.before },
    { id: "after",  label: "Current",  src: lightbox.after  },
    { id: "diff",   label: "Diff",     src: lightbox.diff   },
  ];

  const current = views.find((v) => v.id === active);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-panelborder rounded-md overflow-hidden max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-panelborder px-4 py-3">
          <div className="flex gap-1">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => setActive(v.id)}
                className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  active === v.id
                    ? "border-signal-run bg-signal-run/10 text-mist"
                    : "border-panelborder text-steel hover:text-mist"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={current.src}
              download
              className="font-mono text-[10px] text-signal-run hover:underline"
            >
              ↓ Download
            </a>
            <button
              onClick={onClose}
              className="font-mono text-xs text-steel hover:text-mist"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="p-4 overflow-auto max-h-[75vh]">
          <img
            src={current.src}
            alt={current.label}
            className="max-w-full mx-auto rounded"
          />
        </div>

        {/* Caption */}
        <div className="px-4 py-2 border-t border-panelborder font-mono text-[10px] text-steel/50 text-center">
          {lightbox.label} · {current.label}
          {active === "diff" && " · Red pixels = changed areas"}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SevStat({ label, value, color, border }) {
  return (
    <div className={`bg-panel border ${border} rounded-md px-3 py-2 min-w-[72px]`}>
      <div className={`text-xl font-mono font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-steel mt-0.5">{label}</div>
    </div>
  );
}