import React, { useState, useRef } from "react";

const BASE = "/api";

async function runContentMatch(file, url, username, password) {
  const form = new FormData();
  form.append("docx", file);
  form.append("url", url);
  if (username) form.append("username", username);
  if (password) form.append("password", password);

  const res = await fetch(`${BASE}/content-match`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ─── Status colour helpers ────────────────────────────────────────────────────

function rowBg(status) {
  if (status === "exact") return "bg-signal-pass/8";
  if (status === "fuzzy") return "bg-yellow-400/6";
  if (status === "missing") return "bg-signal-fail/8";
  if (status === "extra") return "bg-panelborder/40";
  return "";
}

function statusPill(status) {
  if (status === "exact")
    return (
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-signal-pass/40 text-signal-pass">
        EXACT
      </span>
    );
  if (status === "fuzzy")
    return (
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-yellow-400/40 text-yellow-400">
        FUZZY
      </span>
    );
  if (status === "missing")
    return (
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-signal-fail/40 text-signal-fail">
        MISSING
      </span>
    );
  if (status === "extra")
    return (
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-steel/30 text-steel/60">
        EXTRA
      </span>
    );
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContentMatchPanel() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState("all"); // all | exact | fuzzy | missing | extra
  const fileRef = useRef();

  function handleFileDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped?.name.endsWith(".docx")) {
      setFile(dropped);
      setError(null);
    } else {
      setError("Only .docx files are supported.");
    }
  }

  async function handleRun(e) {
    e.preventDefault();
    setError(null);
    setReport(null);
    if (!file) { setError("Upload a .docx file."); return; }
    if (!url.trim()) { setError("Enter a website URL."); return; }
    setLoading(true);
    try {
      const result = await runContentMatch(file, url.trim(), username, password);
      setReport(result);
      setFilter("all");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    !report ? ""
    : report.score >= 80 ? "text-signal-pass"
    : report.score >= 50 ? "text-yellow-400"
    : "text-signal-fail";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-semibold text-mist mb-1">
          Content Match Engine
        </h2>
        <p className="text-steel text-sm">
          Upload a <span className="font-mono text-mist">.docx</span> and enter
          a URL — we'll compare the document content against the live page,
          side by side.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleRun} className="space-y-4">
        {/* File drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-md px-6 py-8 text-center transition-colors ${
            file
              ? "border-signal-pass/50 bg-signal-pass/5"
              : "border-panelborder hover:border-steel/60"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setFile(f); setError(null); }
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-signal-pass font-mono text-sm">✓</span>
              <span className="font-mono text-sm text-mist">{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setReport(null);
                }}
                className="font-mono text-[10px] text-steel hover:text-signal-fail ml-2"
              >
                ✕ remove
              </button>
            </div>
          ) : (
            <div>
              <div className="font-mono text-steel text-sm mb-1">
                Drop .docx here or click to browse
              </div>
              <div className="font-mono text-[10px] text-steel/50">Max 10 MB</div>
            </div>
          )}
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
            Target URL
          </label>
          <div className="flex items-center gap-2 bg-panel border border-panelborder rounded-md px-4 py-3 focus-within:border-signal-run transition-colors">
            <span className="text-signal-run font-mono text-sm">$</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="flex-1 bg-transparent outline-none text-mist font-mono text-sm placeholder:text-steel/50"
            />
          </div>
        </div>

        {/* Optional auth */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
              Username <span className="text-steel/40">(optional)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
              Password <span className="text-steel/40">(optional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="text-signal-fail font-mono text-xs border border-signal-fail/40 bg-signal-fail/10 rounded-md px-3 py-2">
            ✗ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal-run text-ink font-sans font-semibold text-sm rounded-md py-3 hover:bg-signal-run/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ink pulse-dot" />
              Comparing content…
            </span>
          ) : (
            "Run Content Match"
          )}
        </button>
      </form>

      {/* Report */}
      {report && (
        <MatchReport
          report={report}
          scoreColor={scoreColor}
          filter={filter}
          setFilter={setFilter}
        />
      )}
    </div>
  );
}

// ─── Full report ──────────────────────────────────────────────────────────────

function MatchReport({ report, scoreColor, filter, setFilter }) {
  const { summary, totalMatchWords, totalDocWords, totalWebWords } = report;

  const FILTERS = [
    { id: "all",     label: "All",         count: summary.total + summary.extra },
    { id: "exact",   label: "Exact Match", count: summary.exact,   color: "text-signal-pass" },
    { id: "fuzzy",   label: "Changed",     count: summary.fuzzy,   color: "text-yellow-400" },
    { id: "missing", label: "Missing",     count: summary.missing, color: "text-signal-fail" },
    { id: "extra",   label: "Extra on web",count: summary.extra,   color: "text-steel/60" },
  ];

  return (
    <div className="space-y-5 border-t border-panelborder pt-6">

      {/* ── Score header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-steel tracking-widest mb-1">
            CONTENT MATCH SCORE
          </div>
          <div className={`font-mono text-5xl font-bold leading-none ${scoreColor}`}>
            {report.score}%
          </div>
          <div className="font-mono text-[10px] text-steel mt-2">
            {totalMatchWords.toLocaleString()} matching words found
          </div>
        </div>

        <div className="text-right space-y-1 font-mono text-xs">
          <div className="text-steel/60 text-[10px] mb-2">
            {report.filename} → {new URL(report.url).hostname}
          </div>
          <StatRow label="Document" value={`${totalDocWords.toLocaleString()} words`} />
          <StatRow label="Website" value={`${totalWebWords.toLocaleString()} words`} />
          <StatRow label="Exact Match" value={summary.exact}   color="text-signal-pass" />
          <StatRow label="Changed"     value={summary.fuzzy}   color="text-yellow-400" />
          <StatRow label="Missing"     value={summary.missing} color="text-signal-fail" />
          <StatRow label="Extra on web" value={summary.extra}  color="text-steel/60" />
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-panelborder rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            report.score >= 80
              ? "bg-signal-pass"
              : report.score >= 50
              ? "bg-yellow-400"
              : "bg-signal-fail"
          }`}
          style={{ width: `${report.score}%` }}
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
              filter === f.id
                ? "border-signal-run bg-signal-run/10 text-mist"
                : "border-panelborder text-steel hover:border-steel/60 hover:text-mist"
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={`ml-1.5 ${
                  filter === f.id ? "text-mist" : f.color || "text-steel/50"
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Column headers ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border border-panelborder rounded-md overflow-hidden">
        <div className="bg-panelborder/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-steel text-center">
          Item 1 · Document
          <div className="text-[9px] text-steel/50 font-normal mt-0.5 normal-case tracking-normal">
            {totalDocWords.toLocaleString()} words · {summary.matched + summary.missing} blocks
          </div>
        </div>
        <div className="bg-panelborder/60 px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-steel text-center border-x border-panelborder">
          Match
        </div>
        <div className="bg-panelborder/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-steel text-center">
          Item 2 · Website
          <div className="text-[9px] text-steel/50 font-normal mt-0.5 normal-case tracking-normal">
            {totalWebWords.toLocaleString()} words · {summary.matched + summary.extra} blocks
          </div>
        </div>
      </div>

      {/* ── Section groups ── */}
      <div className="space-y-0 border border-panelborder rounded-md overflow-hidden divide-y divide-panelborder">
        {report.sections.map((section, si) => {
          const visibleRows = section.rows.filter((row) => {
            if (filter === "all") return true;
            return row.status === filter;
          });
          if (visibleRows.length === 0) return null;

          return (
            <SectionGroup
              key={si}
              section={section}
              rows={visibleRows}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Section group (fold) ─────────────────────────────────────────────────────

function SectionGroup({ section, rows }) {
  const [collapsed, setCollapsed] = useState(false);

  const matchedCount = rows.filter(
    (r) => r.status === "exact" || r.status === "fuzzy"
  ).length;
  const missingCount = rows.filter((r) => r.status === "missing").length;
  const extraCount = rows.filter((r) => r.status === "extra").length;

  return (
    <div>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full grid grid-cols-[1fr_auto_1fr] bg-panelborder/40 hover:bg-panelborder/70 transition-colors"
      >
        <div className="col-span-3 px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-mist tracking-wide">
            {section.name}
          </span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            {matchedCount > 0 && (
              <span className="text-signal-pass">{matchedCount} matched</span>
            )}
            {missingCount > 0 && (
              <span className="text-signal-fail">{missingCount} missing</span>
            )}
            {extraCount > 0 && (
              <span className="text-steel/50">{extraCount} extra</span>
            )}
            <span className="text-steel/40 ml-1">{collapsed ? "▸" : "▾"}</span>
          </div>
        </div>
      </button>

      {/* Rows */}
      {!collapsed && (
        <div className="divide-y divide-panelborder/60">
          {rows.map((row, i) => (
            <CompareRow key={i} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single comparison row (Copyscape style) ──────────────────────────────────

function CompareRow({ row }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] min-h-[3rem] ${rowBg(row.status)}`}>
      {/* Left: Document text */}
      <div className="px-4 py-3 border-r border-panelborder/40">
        {row.docText ? (
          <p
            className={`text-sm leading-relaxed break-words ${
              row.docType === "heading"
                ? "font-semibold text-mist"
                : "text-steel/80"
            }`}
          >
            {row.docText}
          </p>
        ) : (
          <span className="text-steel/20 font-mono text-xs">—</span>
        )}
      </div>

      {/* Middle: word count + status */}
      <div className="px-3 py-3 flex flex-col items-center justify-center gap-1 min-w-[90px] border-r border-panelborder/40">
        {row.status !== "extra" && row.matchWords > 0 && (
          <span className="font-mono text-xs text-steel/70 whitespace-nowrap">
            «&nbsp;{row.matchWords}&nbsp;words&nbsp;»
          </span>
        )}
        {statusPill(row.status)}
        {row.status === "fuzzy" && (
          <span className="font-mono text-[9px] text-yellow-400/70">
            {row.score}%
          </span>
        )}
      </div>

      {/* Right: Website text */}
      <div className="px-4 py-3">
        {row.webText ? (
          <p
            className={`text-sm leading-relaxed break-words ${
              row.status === "extra"
                ? "text-steel/50"
                : row.docType === "heading"
                ? "font-semibold text-mist"
                : "text-steel/80"
            }`}
          >
            {row.webText}
          </p>
        ) : (
          <span className="text-steel/20 font-mono text-xs">—</span>
        )}
      </div>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function StatRow({ label, value, color = "text-mist" }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-steel/60">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}